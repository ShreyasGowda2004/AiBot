package com.aichatbot.controller;

import com.aichatbot.service.RAGService;
import com.aichatbot.repository.EmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"}, allowCredentials = "true")
public class AdminController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    private final RAGService ragService;
    private final EmbeddingStore embeddingStore;
    
    public AdminController(RAGService ragService, EmbeddingStore embeddingStore) {
        this.ragService = ragService;
        this.embeddingStore = embeddingStore;
    }
    
    @PostMapping("/reindex")
    public CompletableFuture<ResponseEntity<Map<String, String>>> reindexRepository() {
        logger.info("Manual repository reindex requested");
        
        return ragService.reindexRepository()
                .thenApply(v -> ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Repository reindexing started"
                )))
                .exceptionally(ex -> {
                    logger.error("Failed to start repository reindexing", ex);
                    return ResponseEntity.internalServerError().body(Map.of(
                            "status", "error",
                            "message", "Failed to start reindexing: " + ex.getMessage()
                    ));
                });
    }
    
    @GetMapping("/status")
    public CompletableFuture<ResponseEntity<List<RAGService.RepositoryStatus>>> getRepositoryStatus() {
        return ragService.getRepositoryStatus()
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    logger.error("Failed to get repository status", ex);
                    return ResponseEntity.internalServerError().build();
                });
    }
    
    @PostMapping("/initialize")
    public CompletableFuture<ResponseEntity<Map<String, String>>> initializeRepository() {
        logger.info("Repository initialization requested");
        
        return ragService.initializeRepository()
                .thenApply(v -> ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Repository initialization started"
                )))
                .exceptionally(ex -> {
                    logger.error("Failed to initialize repository", ex);
                    return ResponseEntity.internalServerError().body(Map.of(
                            "status", "error",
                            "message", "Failed to initialize repository: " + ex.getMessage()
                    ));
                });
    }

    @GetMapping("/embeddings/stats")
    public ResponseEntity<Map<String, Object>> getEmbeddingStats() {
        long count = embeddingStore.count();
        long sizeBytes = embeddingStore.sizeOnDiskBytes();
        return ResponseEntity.ok(Map.of(
                "count", count,
                "sizeBytes", sizeBytes,
                "sizeMB", sizeBytes >= 0 ? String.format("%.2f", sizeBytes / 1048576.0) : "-1"
        ));
    }
}
