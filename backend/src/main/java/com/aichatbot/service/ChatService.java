package com.aichatbot.service;

import com.aichatbot.dto.ChatRequest;
import com.aichatbot.dto.ChatResponse;
import com.aichatbot.model.DocumentEmbedding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class ChatService {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);
    
    private final DocumentProcessingService documentProcessingService;
    private final OllamaService ollamaService;
    
    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;
    
    public ChatService(DocumentProcessingService documentProcessingService,
                      OllamaService ollamaService) {
        this.documentProcessingService = documentProcessingService;
        this.ollamaService = ollamaService;
    }
    
    public CompletableFuture<ChatResponse> processMessage(ChatRequest request) {
        long startTime = System.currentTimeMillis();
        String sessionId = request.getSessionId() != null ? request.getSessionId() : generateSessionId();
    final boolean fastMode = request.isFastMode();
    final boolean fullContent = request.isFullContent();
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                logger.info("Processing message for session: {}", sessionId);
                
                // Ultra fast direct file requests still respected
                if (isDirectFileRequest(request.getMessage())) {
                    return handleDirectFileRequest(request.getMessage(), sessionId, startTime);
                }
                
                                // Get relevant context if requested - USE HYBRID SEARCH APPROACH
                List<DocumentEmbedding> relevantChunks = List.of();
                if (request.isIncludeContext()) {
                    if (fullContent) {
                        // Directly load ALL chunks from best matching file for fullContent mode (fast retrieval path)
                        relevantChunks = documentProcessingService.findBestMatchingFile(request.getMessage());
                    } else {
                        // Hybrid search placeholder (file-based scoring)
                        int maxChunks = fastMode ? 6 : 25;
                        relevantChunks = documentProcessingService.findSimilarDocumentsHybrid(request.getMessage(), maxChunks, fastMode ? 0.6 : 0.7);
                    }
                    
                    // FALLBACK 1: If hybrid search fails or returns no results, try best file approach
                    if (relevantChunks.isEmpty() && (!fastMode || fullContent)) { // allow deeper search / fallback
                        logger.info("Hybrid search returned no results, trying best file approach for: {}", request.getMessage());
                        relevantChunks = documentProcessingService.findBestMatchingFile(request.getMessage());
                    }
                    
                    // FALLBACK 2: If no best file found, try standard search
                    if (relevantChunks.isEmpty() && (!fastMode || fullContent)) {
                        logger.info("No best file found, trying standard search for: {}", request.getMessage());
                        relevantChunks = documentProcessingService.findRelevantChunks(request.getMessage(), 25);
                    }
                    
                    // FALLBACK 3: Last resort - keyword-based search
                    if (relevantChunks.isEmpty() && (!fastMode || fullContent)) {
                        logger.info("No results with standard search, trying keyword fallback for: {}", request.getMessage());
                        relevantChunks = documentProcessingService.findRelevantChunksByKeywords(request.getMessage(), 50);
                    }
                }
                
                // Always use LLM for intelligent analysis and extraction
                // Build context-aware prompt with complete file data and let LLM analyze what to return
                String contextualPrompt = buildContextualPrompt(request.getMessage(), relevantChunks);
                String response = ollamaService.generateResponse(contextualPrompt);
                
                // response already prepared above
                
                long responseTime = System.currentTimeMillis() - startTime;
                
                // Return sanitized source file references for security (no actual file paths)
                List<String> sourceFiles = relevantChunks.stream()
                        .map(this::sanitizeSourceFile)
                        .distinct()
                        .limit(1) // Return only the most relevant source file
                        .toList();
                
                logger.info("Successfully processed message in {}ms", responseTime);
                
                return ChatResponse.success(response, sessionId, responseTime, sourceFiles, modelName);
                
            } catch (Exception e) {
                logger.error("Failed to process message for session: {}", sessionId, e);
                return ChatResponse.error("I apologize, but I encountered an error while processing your request. Please try again.", sessionId);
            }
        });
    }
    
    /**
     * Check if the user is requesting direct file content without LLM processing
     */
    private boolean isDirectFileRequest(String message) {
        String lowerMessage = message.toLowerCase().trim();
        
        // Check for direct file requests
        return lowerMessage.contains(".md") || 
               lowerMessage.matches(".*\\b(show|give|get|display)\\s+(me\\s+)?(the\\s+)?(complete|full|entire|whole)\\s+.*") ||
               lowerMessage.matches(".*\\b(raw|exact|direct|unprocessed)\\s+(content|file|document)\\b.*") ||
               lowerMessage.matches(".*\\bjust\\s+(show|give|display)\\s+.*") ||
               lowerMessage.matches(".*\\bonly\\s+(show|give|display)\\s+.*");
    }
    
    /**
     * Handle direct file content requests by returning raw content without LLM processing
     */
    private ChatResponse handleDirectFileRequest(String message, String sessionId, long startTime) {
        logger.info("Handling direct file request for: {}", message);
        
        try {
            // Find the best matching file
            List<DocumentEmbedding> chunks = documentProcessingService.findBestMatchingFile(message);
            
            if (chunks.isEmpty()) {
                return ChatResponse.error("No matching file found for your request.", sessionId);
            }
            
            // Combine all chunks from the file in order
            StringBuilder fullContent = new StringBuilder();
            final String[] fileName = {null};
            
            chunks.stream()
                .sorted((a, b) -> Integer.compare(
                    a.getChunkIndex() != null ? a.getChunkIndex() : 0,
                    b.getChunkIndex() != null ? b.getChunkIndex() : 0))
                .forEach(chunk -> {
                    if (fileName[0] == null) {
                        fileName[0] = chunk.getFilePath();
                    }
                    fullContent.append(chunk.getContentChunk()).append("\n");
                });
            
            String response = String.format("**File: %s**\n\n%s", fileName[0], fullContent.toString());
            
            long responseTime = System.currentTimeMillis() - startTime;
            
            logger.info("Successfully handled direct file request in {}ms", responseTime);
            return ChatResponse.success(response, sessionId, responseTime, List.of(fileName[0]), "Direct File Content");
            
        } catch (Exception e) {
            logger.error("Failed to handle direct file request", e);
            return ChatResponse.error("Failed to retrieve file content. Please try again.", sessionId);
        }
    }

    private String buildContextualPrompt(String userQuery, List<DocumentEmbedding> relevantChunks) {
        if (relevantChunks.isEmpty()) {
            return String.format("""
                USER QUESTION: %s
                
                No relevant documentation found for this query. Please try different keywords or check if the topic is covered under different terminology in the available documentation.
                """, userQuery);
        }
        
        // Check if user wants raw/exact content (keywords: "exact", "raw", "only", "just", "direct") 
        // OR if they want complete guides/setups
        boolean wantsRawContent = userQuery.toLowerCase().matches(".*\\b(only|just|exact|raw|direct|exactly)\\b.*");
        boolean wantsCompleteGuide = userQuery.toLowerCase().matches(".*\\b(setup|install|guide|complete|full|entire|all steps|walkthrough)\\b.*");
        
        // Check if user is asking "how to create/setup" something and needs prerequisites
        boolean isHowToCreateQuery = userQuery.toLowerCase().matches(".*\\b(how to|how do|how can|steps to|process for|method for).*(create|setup|install|configure|build|deploy|establish)\\b.*");
        
        StringBuilder contextBuilder = new StringBuilder();
        
        // Group chunks by file and include ALL chunks from the best matching file(s)
        Map<String, List<DocumentEmbedding>> chunksByFile = relevantChunks.stream()
                .collect(Collectors.groupingBy(DocumentEmbedding::getFilePath));
        
        // Process all files (since findBestMatchingFile already returns content from single best file)
        for (Map.Entry<String, List<DocumentEmbedding>> fileEntry : chunksByFile.entrySet()) {
            String filePath = fileEntry.getKey();
            List<DocumentEmbedding> fileChunks = fileEntry.getValue();
            
            contextBuilder.append("\n--- Content from: ").append(filePath).append(" ---\n");
            
            // Sort chunks by index to maintain original order and include ALL chunks
            fileChunks.stream()
                    .filter(chunk -> chunk.getContentChunk() != null && chunk.getContentChunk().length() > 20)
                    .sorted((a, b) -> Integer.compare(
                        a.getChunkIndex() != null ? a.getChunkIndex() : 0,
                        b.getChunkIndex() != null ? b.getChunkIndex() : 0))
                    .forEach(chunk -> {
                        contextBuilder.append(chunk.getContentChunk()).append("\n");
                    });
        }
        
        String contextContent = contextBuilder.toString();
        
        // Check if prerequisites exist in the content
        boolean hasPrerequisites = contextContent.toLowerCase().contains("prerequisite") || 
                                   contextContent.toLowerCase().contains("requirements") ||
                                   contextContent.toLowerCase().contains("before you begin") ||
                                   contextContent.toLowerCase().contains("before starting") ||
                                   contextContent.toLowerCase().contains("prereq");
        
        if (wantsRawContent || wantsCompleteGuide) {
            // Ultra-direct mode for raw content requests and complete setup guides
            return String.format("""
                Return the COMPLETE content related to: "%s"
                
                CRITICAL: Provide ALL steps, commands, and procedures from the document.
                Do NOT summarize, truncate, or skip any details.
                Include ALL download links, installation steps, configuration details, and verification commands.
                Maintain exact formatting, commands, file paths, and structure from the original documentation.
                When the document contains numbered steps, include ALL steps in order.
                
                CONTENT:
                %s
                
                RETURN COMPLETE CONTENT:
                """, userQuery, contextContent);
        } else if (isHowToCreateQuery && hasPrerequisites) {
            // Special mode for "how to create" queries with prerequisites
            return String.format("""
                You are an expert technical assistant. The user is asking how to create/setup something. 
                
                USER QUESTION: "%s"
                
                CRITICAL INSTRUCTIONS FOR PREREQUISITE HANDLING:
                1. FIRST, extract and show any Prerequisites/Requirements sections from the documentation
                2. Format Prerequisites clearly with a "Prerequisites" or "Requirements" heading
                3. THEN, extract ONLY the specific section that answers the user's question
                4. Do NOT include the entire document - be selective and focused
                5. If they ask "how to create organization", show ONLY organization creation steps
                6. If they ask "how to setup X", show ONLY X setup steps
                7. Maintain exact formatting, commands, and structure from the original documentation
                8. Include ALL necessary details for the specific operation they're asking about
                9. Do NOT include unrelated operations, sections, or other topics from the same file
                
                RESPONSE FORMAT:
                # Prerequisites
                [Extract and list only the prerequisite/requirement sections here]
                
                # [Main Topic User Asked About]
                [Extract and show ONLY the specific section that answers their question]
                
                COMPLETE DOCUMENTATION:
                %s
                
                EXTRACT PREREQUISITES FIRST, THEN SHOW ONLY THE SPECIFIC SECTION FOR: %s
                """, userQuery, contextContent, userQuery);
        } else {
            // Standard mode with emphasis on intelligent extraction based on user question
            return String.format("""
                You are an expert technical assistant. Analyze the user's question and extract ONLY the relevant information from the provided documentation.
                
                USER QUESTION: "%s"
                
                CRITICAL INSTRUCTIONS - BE SELECTIVE:
                1. Read and understand what the user is specifically asking for
                2. From the complete documentation below, extract ONLY the section(s) that directly answer their question
                3. Do NOT return the entire document or complete file content
                4. If they ask "how to create X", provide ONLY the creation steps, not query/update/delete operations
                5. If they ask "how to query X", provide ONLY the query examples, not creation/update operations  
                6. If they ask "how to update X", provide ONLY the update steps, not creation/query operations
                7. If they ask "how to delete X", provide ONLY the deletion steps, not creation/update operations
                8. Maintain the exact formatting, commands, and structure from the original documentation
                9. Include ALL necessary details for the specific operation they're asking about
                10. Do NOT include unrelated operations, sections, or topics from the same file
                11. Be focused and targeted - users want specific answers, not entire documents
                
                COMPLETE DOCUMENTATION:
                %s
                
                EXTRACT AND PROVIDE ONLY THE SPECIFIC SECTION THAT ANSWERS: %s
                """, userQuery, contextContent, userQuery);
        }
    }
    
    // No persistence of chat history, so no need to extract file names for storage
    
    private String generateSessionId() {
        return UUID.randomUUID().toString();
    }
    
    // Chat history is intentionally not persisted
    
    /**
     * Sanitize source file paths for security - returns generic descriptions instead of actual paths
     */
    private String sanitizeSourceFile(DocumentEmbedding embedding) {
        String filePath = embedding.getFilePath();
        
        // Extract meaningful category from file path without revealing internal structure
        if (filePath.contains("db2")) {
            return "Database Configuration Guide";
        } else if (filePath.contains("maximo") && filePath.contains("install")) {
            return "Maximo Installation Guide";
        } else if (filePath.contains("maximo") && filePath.contains("setup")) {
            return "Maximo Setup Guide";
        } else if (filePath.contains("liberty")) {
            return "WebSphere Liberty Configuration";
        } else if (filePath.contains("mongo")) {
            return "MongoDB Configuration Guide";
        } else if (filePath.contains("java")) {
            return "Java Configuration Guide";
        } else if (filePath.contains("openshift")) {
            return "OpenShift Deployment Guide";
        } else if (filePath.contains("system")) {
            return "System Configuration Guide";
        } else if (filePath.contains("restapi")) {
            return "REST API Documentation";
        } else if (filePath.contains("manage")) {
            return "Maximo Manage Configuration";
        } else if (filePath.contains("mas-suite")) {
            return "MAS Suite Installation Guide";
        } else {
            return "Technical Documentation";
        }
    }
}
