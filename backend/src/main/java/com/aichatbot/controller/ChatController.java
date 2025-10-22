package com.aichatbot.controller;

import com.aichatbot.dto.ChatRequest;
import com.aichatbot.dto.ChatResponse;
import com.aichatbot.service.ChatService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"}, allowCredentials = "true")
public class ChatController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    
    private final ChatService chatService;
    
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }
    
    @PostMapping("/message")
    public CompletableFuture<ResponseEntity<ChatResponse>> sendMessage(@Valid @RequestBody ChatRequest request) {
        logger.info("Received chat message from session: {}", request.getSessionId());
        
        return chatService.processMessage(request)
                .thenApply(response -> {
                    if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.internalServerError().body(response);
                    }
                })
                .exceptionally(ex -> {
                    logger.error("Failed to process chat message", ex);
                    ChatResponse errorResponse = ChatResponse.error(
                            "An unexpected error occurred. Please try again.", 
                            request.getSessionId()
                    );
                    return ResponseEntity.internalServerError().body(errorResponse);
                });
    }
    // Chat history endpoints intentionally removed: no session history is stored
}
