package com.aichatbot.service;

import com.aichatbot.dto.GitHubFile;
import com.aichatbot.config.GitHubRepositoryConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RAGService {
    
    private static final Logger logger = LoggerFactory.getLogger(RAGService.class);
    
    private final GitHubService gitHubService;
    private final DocumentProcessingService documentProcessingService;
    private final GitHubRepositoryConfig repositoryConfig;
    @Value("${rag.cleanOnStartup:true}")
    private boolean cleanOnStartup;
    
    private volatile boolean indexingInProgress = false;
    private volatile long lastIndexTime = 0;
    
    public RAGService(GitHubService gitHubService, DocumentProcessingService documentProcessingService, 
                      GitHubRepositoryConfig repositoryConfig) {
        this.gitHubService = gitHubService;
        this.documentProcessingService = documentProcessingService;
        this.repositoryConfig = repositoryConfig;
    }

    @PostConstruct
    public void purgeOnStartup() {
        if (cleanOnStartup) {
            logger.info("cleanOnStartup enabled: purging existing embeddings before indexing");
            repositoryConfig.getRepositories().forEach(repo -> {
                try {
                    documentProcessingService.reprocessRepository(repo.getOwner(), repo.getName()).join();
                } catch (Exception e) {
                    logger.warn("Failed purge for {}/{}", repo.getOwner(), repo.getName(), e);
                }
            });
        } else {
            logger.info("cleanOnStartup disabled: retaining existing embeddings");
        }
    }
    
    @Async
    public CompletableFuture<Void> initializeRepository() {
        if (indexingInProgress) {
            logger.info("Repository indexing already in progress");
            return CompletableFuture.completedFuture(null);
        }
        
        return indexRepository(false);
    }
    
    @Async
    public CompletableFuture<Void> reindexRepository() {
        return indexRepository(true);
    }
    
    private CompletableFuture<Void> indexRepository(boolean forceReindex) {
        return CompletableFuture.runAsync(() -> {
            indexingInProgress = true;
            long startTime = System.currentTimeMillis();
            
            try {
                logger.info("Starting repository indexing for {} repositories (force: {})", 
                           repositoryConfig.getRepositories().size(), forceReindex);
                
                if (forceReindex) {
                    for (GitHubRepositoryConfig.Repository repo : repositoryConfig.getRepositories()) {
                        documentProcessingService.reprocessRepository(repo.getOwner(), repo.getName()).join();
                    }
                }
                
                List<GitHubFile> allFiles = gitHubService.getAllFiles().join();
                logger.info("Found {} files across all repositories", allFiles.size());
                
                List<GitHubFile> textFiles = allFiles.stream()
                        .filter(file -> gitHubService.isTextFile(file.getName()))
                        .toList();
                
                logger.info("Processing {} text files", textFiles.size());
                
                AtomicInteger processed = new AtomicInteger(0);
                AtomicInteger failed = new AtomicInteger(0);
                
                int batchSize = 10;
                for (int i = 0; i < textFiles.size(); i += batchSize) {
                    int end = Math.min(i + batchSize, textFiles.size());
                    List<GitHubFile> batch = textFiles.subList(i, end);
                    
                    List<CompletableFuture<Void>> batchFutures = batch.stream()
                            .map(file -> processFile(file, processed, failed))
                            .toList();
                    
                    CompletableFuture.allOf(batchFutures.toArray(new CompletableFuture[0])).join();
                    
                    int currentProgress = processed.get();
                    if (currentProgress % 20 == 0 || currentProgress == textFiles.size()) {
                        logger.info("Processed {}/{} files ({} failed)", 
                                   currentProgress, textFiles.size(), failed.get());
                    }
                }
                
                long duration = System.currentTimeMillis() - startTime;
                lastIndexTime = System.currentTimeMillis();
                
                logger.info("Repository indexing completed in {}ms. Processed: {}, Failed: {}", 
                           duration, processed.get(), failed.get());
                
            } catch (Exception e) {
                logger.error("Repository indexing failed", e);
            } finally {
                indexingInProgress = false;
            }
        });
    }
    
    private CompletableFuture<Void> processFile(GitHubFile file, AtomicInteger processed, AtomicInteger failed) {
        GitHubRepositoryConfig.Repository repository = repositoryConfig.getRepositories().stream()
                .filter(repo -> repo.getFullName().equals(file.getRepositoryName()))
                .findFirst()
                .orElse(repositoryConfig.getRepositories().get(0));
        
        return gitHubService.getFileContent(repository, file.getPath())
                .thenCompose(fileWithContent -> {
                    try {
                        return documentProcessingService.processDocument(
                                fileWithContent.getPath(),
                                fileWithContent.getContent(),
                                repository.getOwner(),
                                repository.getName(),
                                repository.getBranch()
                        ).thenRun(() -> processed.incrementAndGet());
                    } catch (Exception e) {
                        logger.warn("Failed to process file: {} from repository: {}", 
                                   file.getPath(), file.getRepositoryName(), e);
                        failed.incrementAndGet();
                        return CompletableFuture.completedFuture(null);
                    }
                })
                .exceptionally(ex -> {
                    logger.warn("Failed to get content for file: {} from repository: {}", 
                               file.getPath(), file.getRepositoryName(), ex);
                    failed.incrementAndGet();
                    return null;
                });
    }
    
    @Scheduled(fixedRate = 21600000)
    public void scheduledReindex() {
        if (!indexingInProgress && System.currentTimeMillis() - lastIndexTime > 21600000) {
            logger.info("Starting scheduled repository re-indexing");
            initializeRepository();
        }
    }
    
    public boolean isIndexingInProgress() {
        return indexingInProgress;
    }
    
    public long getLastIndexTime() {
        return lastIndexTime;
    }
    
    public CompletableFuture<List<RepositoryStatus>> getRepositoryStatus() {
        return CompletableFuture.supplyAsync(() -> {
            return repositoryConfig.getRepositories().stream()
                    .map(repo -> {
                        RepositoryStatus status = new RepositoryStatus();
                        status.setIndexingInProgress(indexingInProgress);
                        status.setLastIndexTime(lastIndexTime);
                        status.setRepositoryOwner(repo.getOwner());
                        status.setRepositoryName(repo.getName());
                        status.setBranchName(repo.getBranch());
                        status.setFullName(repo.getFullName());
                        return status;
                    })
                    .toList();
        });
    }
    
    public static class RepositoryStatus {
        private boolean indexingInProgress;
        private long lastIndexTime;
        private String repositoryOwner;
        private String repositoryName;
        private String branchName;
        private String fullName;
        
        public boolean isIndexingInProgress() { return indexingInProgress; }
        public void setIndexingInProgress(boolean indexingInProgress) { this.indexingInProgress = indexingInProgress; }
        
        public long getLastIndexTime() { return lastIndexTime; }
        public void setLastIndexTime(long lastIndexTime) { this.lastIndexTime = lastIndexTime; }
        
        public String getRepositoryOwner() { return repositoryOwner; }
        public void setRepositoryOwner(String repositoryOwner) { this.repositoryOwner = repositoryOwner; }
        
        public String getRepositoryName() { return repositoryName; }
        public void setRepositoryName(String repositoryName) { this.repositoryName = repositoryName; }
        
        public String getBranchName() { return branchName; }
        public void setBranchName(String branchName) { this.branchName = branchName; }
        
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
    }
}
