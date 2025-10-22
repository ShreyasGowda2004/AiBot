package com.aichatbot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class OllamaService {
    
    private static final Logger logger = LoggerFactory.getLogger(OllamaService.class);
    
    private final HttpClient httpClient;
    
    @Value("${spring.ai.ollama.base-url}")
    private String ollamaBaseUrl;
    
    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;
    
    public OllamaService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }
    
    public String generateResponse(String prompt) {
        try {
            logger.debug("Generating response using model: {}", modelName);
            
            String requestBody = buildRequestBody(prompt);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaBaseUrl + "/api/generate"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofMinutes(10))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() != 200) {
                logger.error("Ollama API error: {} - {}", response.statusCode(), response.body());
                throw new RuntimeException("Ollama API returned status: " + response.statusCode());
            }
            
            return parseResponse(response.body());
            
        } catch (IOException | InterruptedException e) {
            logger.error("Failed to communicate with Ollama", e);
            throw new RuntimeException("Failed to generate response: " + e.getMessage());
        }
    }
    
    private String buildRequestBody(String prompt) {
        // Heuristic: if prompt is short (< 1200 chars) we request fewer tokens to accelerate generation
        int numPredict = prompt.length() < 1200 ? 512 : 2048; // previously 8192
        int numCtx = Math.min(8192, 16384); // cap to 8k for speed
        return String.format("""
                {
                    "model": "%s",
                    "prompt": "%s",
                    "stream": false,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9,
                        "num_predict": %d,
                        "num_ctx": %d
                    }
                }
                """, modelName, escapeJson(prompt), numPredict, numCtx);
    }
    
    private String parseResponse(String responseBody) {
        try {
            // Simple JSON parsing - in production use proper JSON library
            int responseStart = responseBody.indexOf("\"response\":\"") + 12;
            int responseEnd = responseBody.lastIndexOf("\",\"done\"");
            
            if (responseStart > 11 && responseEnd > responseStart) {
                String response = responseBody.substring(responseStart, responseEnd);
                return unescapeJson(response);
            }
            
            logger.warn("Could not parse Ollama response: {}", responseBody);
            return "I apologize, but I couldn't generate a proper response. Please try again.";
            
        } catch (Exception e) {
            logger.error("Failed to parse Ollama response", e);
            return "I encountered an error while processing your request. Please try again.";
        }
    }
    
    private String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
    
    private String unescapeJson(String text) {
        return text.replace("\\\\", "\\")
                   .replace("\\\"", "\"")
                   .replace("\\n", "\n")
                   .replace("\\r", "\r")
                   .replace("\\t", "\t");
    }
    
    public boolean isHealthy() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaBaseUrl + "/api/tags"))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
            
        } catch (Exception e) {
            logger.warn("Ollama health check failed", e);
            return false;
        }
    }
}
