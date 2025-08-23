# Forex Data Service

A Flask-based API service that provides forex data using yfinance library.

## Features

- Real-time forex price data
- Historical forex data with various timeframes
- Bulk data fetching with caching
- Support for major currency pairs, commodities, and indices

## API Endpoints

- `GET /api/forex-data` - Get historical data for a currency pair
- `GET /api/forex-price` - Get current price for a currency pair
- `GET /api/bulk-forex-price` - Get current prices for multiple pairs (cached)
- `GET /api/bulk-forex-data` - Get historical data for multiple pairs

## Deployment

This service is configured for deployment on Render.com with automatic scaling and 24/7 availability.

## Environment Variables

- `PORT` - Server port (default: 5009)
- `FLASK_ENV` - Flask environment (production/development)
