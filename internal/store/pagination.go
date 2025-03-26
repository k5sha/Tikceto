package store

import (
	"net/http"
	"strconv"
	"time"
)

type PaginatedMoviesQuery struct {
	Limit  int     `json:"limit" validate:"min=1,max=20"`
	Offset int     `json:"offset" validate:"min=0"`
	Sort   string  `json:"sort" validate:"oneof=asc desc"`
	Search string  `json:"search" validate:"max=100"`
	Since  *string `json:"since"`
	Until  *string `json:"until"`
}

func (pq *PaginatedMoviesQuery) Parse(r *http.Request) (PaginatedMoviesQuery, error) {
	qs := r.URL.Query()

	if limit := qs.Get("limit"); limit != "" {
		l, err := strconv.Atoi(limit)
		if err != nil {
			return *pq, err
		}
		pq.Limit = l
	}

	if offset := qs.Get("offset"); offset != "" {
		o, err := strconv.Atoi(offset)
		if err != nil {
			return *pq, err
		}
		pq.Offset = o
	}

	if sort := qs.Get("sort"); sort != "" {
		pq.Sort = sort
	}

	if search := qs.Get("search"); search != "" {
		pq.Search = search
	}

	if since := qs.Get("since"); since != "" {
		if validSince := parseDate(since); validSince != "" {
			pq.Since = &validSince
		} else {
			pq.Since = nil
		}
	}

	if until := qs.Get("until"); until != "" {
		if validUntil := parseDate(until); validUntil != "" {
			pq.Until = &validUntil
		} else {
			pq.Until = nil
		}
	}

	return *pq, nil
}

func parseDate(s string) string {
	t, err := time.Parse("2006-02-01", s)
	if err != nil {
		return ""
	}
	return t.Format("2006-02-01")
}
