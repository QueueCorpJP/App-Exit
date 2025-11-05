package models

import (
	"encoding/json"
	"time"
)

// Date represents a date without time (YYYY-MM-DD format)
type Date struct {
	time.Time
}

// UnmarshalJSON implements custom JSON unmarshaling for date-only format
func (d *Date) UnmarshalJSON(b []byte) error {
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}

	if s == "" {
		return nil
	}

	// Parse date-only format (YYYY-MM-DD)
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return err
	}

	d.Time = t
	return nil
}

// MarshalJSON implements custom JSON marshaling for date-only format
func (d Date) MarshalJSON() ([]byte, error) {
	if d.Time.IsZero() {
		return json.Marshal(nil)
	}
	return json.Marshal(d.Time.Format("2006-01-02"))
}
