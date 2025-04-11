package main

import (
	"net/http"
)

func (app *application) internalServerError(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Errorf("internal error", "method", r.Method, "url", r.URL.Path, "err", err.Error())
	writeJSONError(w, http.StatusInternalServerError, "the server encountered an internal error")
}

func (app *application) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("bad request error", "method", r.Method, "url", r.URL.Path, "err", err)
	writeJSONError(w, http.StatusBadRequest, err.Error())
}

func (app *application) notFoundResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("not found error", "method", r.Method, "url", r.URL.Path, "err", err)
	writeJSONError(w, http.StatusNotFound, "not found")
}

func (app *application) unauthorizedBasicErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("unauthorized basic error", "method", r.Method, "url", r.URL.Path, "err", err)

	w.Header().Set("WWW-Authenticate", `Basic realm="restricted", charset="UTF-8"`)
	writeJSONError(w, http.StatusUnauthorized, "unauthorized")
}

func (app *application) unauthorizedErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("unauthorized error", "method", r.Method, "url", r.URL.Path, "err", err)
	writeJSONError(w, http.StatusUnauthorized, "unauthorized")
}

func (app *application) forbiddenErrorResponse(w http.ResponseWriter, r *http.Request) {
	app.logger.Warnf("forbidden error", "method", r.Method, "url", r.URL.Path)
	writeJSONError(w, http.StatusForbidden, "forbidden")
}
