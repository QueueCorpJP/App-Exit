package response

import (
	"encoding/json"
	"log"
	"net/http"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func Success(w http.ResponseWriter, status int, data interface{}) {
	log.Printf("\n========== RESPONSE SUCCESS START ==========\n")
	log.Printf("[RESPONSE] Status: %d", status)
	log.Printf("[RESPONSE] Data type: %T", data)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := Response{
		Success: true,
		Data:    data,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("[RESPONSE] ❌ ERROR: Error encoding success response: %v", err)
	} else {
		log.Printf("[RESPONSE] ✓ Success response sent successfully")
	}
	log.Printf("========== RESPONSE SUCCESS END ==========\n\n")
}

func Error(w http.ResponseWriter, status int, message string) {
	log.Printf("\n========== RESPONSE ERROR START ==========\n")
	log.Printf("[RESPONSE] Status: %d", status)
	log.Printf("[RESPONSE] Message: %s", message)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := Response{
		Success: false,
		Error:   message,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("[RESPONSE] ❌ ERROR: Error encoding error response: %v", err)
	} else {
		log.Printf("[RESPONSE] ✓ Error response sent successfully")
	}
	log.Printf("========== RESPONSE ERROR END ==========\n\n")
}

func SuccessWithMessage(w http.ResponseWriter, status int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := Response{
		Success: true,
		Message: message,
		Data:    data,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("[RESPONSE] Error encoding success response: %v", err)
	}
}
