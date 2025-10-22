package com.aichatbot.model;

import java.time.LocalDateTime;

public class DocumentEmbedding {
    
    private String id;

    private String filePath;

    private String repositoryOwner;

    private String repositoryName;

    private String branchName;

    private String contentChunk;

    private Integer chunkIndex;

    private String fileHash;

    private String embeddingId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Lifecycle helpers
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public DocumentEmbedding() {}
    
    public DocumentEmbedding(String filePath, String repositoryOwner, String repositoryName, 
                           String branchName, String contentChunk, Integer chunkIndex) {
        this.filePath = filePath;
        this.repositoryOwner = repositoryOwner;
        this.repositoryName = repositoryName;
        this.branchName = branchName;
        this.contentChunk = contentChunk;
        this.chunkIndex = chunkIndex;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public String getRepositoryOwner() { return repositoryOwner; }
    public void setRepositoryOwner(String repositoryOwner) { this.repositoryOwner = repositoryOwner; }
    
    public String getRepositoryName() { return repositoryName; }
    public void setRepositoryName(String repositoryName) { this.repositoryName = repositoryName; }
    
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    
    public String getContentChunk() { return contentChunk; }
    public void setContentChunk(String contentChunk) { this.contentChunk = contentChunk; }
    
    public Integer getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }
    
    public String getFileHash() { return fileHash; }
    public void setFileHash(String fileHash) { this.fileHash = fileHash; }
    
    public String getEmbeddingId() { return embeddingId; }
    public void setEmbeddingId(String embeddingId) { this.embeddingId = embeddingId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
