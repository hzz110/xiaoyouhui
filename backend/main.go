package main

import (
	"encoding/json"
	"net/http"

	"github.com/syumai/workers"
)

type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

func main() {
	http.HandleFunc("/api/hello", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		json.NewEncoder(w).Encode(Response{
			Message: "Welcome to Southwest Jiaotong University Alumni Association API!",
			Status:  "success",
		})
	})
	
	// Start the Cloudflare Worker server
	workers.Serve(nil)
}
