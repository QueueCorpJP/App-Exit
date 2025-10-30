package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/pkg/response"
)

func (s *Server) HandleProducts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.GetProducts(w, r)
	case http.MethodPost:
		s.CreateProduct(w, r)
	default:
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *Server) HandleProductByID(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.GetProductByID(w, r)
	case http.MethodPut:
		s.UpdateProduct(w, r)
	case http.MethodDelete:
		s.DeleteProduct(w, r)
	default:
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *Server) GetProducts(w http.ResponseWriter, r *http.Request) {
	// TODO: Fetch products from database
	products := []models.Product{
		{ID: 1, Name: "Product 1", Price: 99.99, Stock: 10},
		{ID: 2, Name: "Product 2", Price: 149.99, Stock: 5},
	}

	response.Success(w, http.StatusOK, products)
}

func (s *Server) GetProductByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	// TODO: Fetch product from database
	product := models.Product{
		ID:          id,
		Name:        "Sample Product",
		Description: "This is a sample product",
		Price:       99.99,
		Stock:       10,
	}

	response.Success(w, http.StatusOK, product)
}

func (s *Server) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// TODO: Validate and insert product into database
	product := models.Product{
		ID:          1,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
		CategoryID:  req.CategoryID,
	}

	response.Success(w, http.StatusCreated, product)
}

func (s *Server) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var req models.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// TODO: Update product in database
	product := models.Product{
		ID:    id,
		Name:  "Updated Product",
		Price: 199.99,
		Stock: 20,
	}

	response.Success(w, http.StatusOK, product)
}

func (s *Server) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	// TODO: Delete product from database
	response.Success(w, http.StatusOK, map[string]interface{}{
		"message": "Product deleted successfully",
		"id":      id,
	})
}
