# IPTV Streaming Server

## Overview
A lightweight IPTV streaming server built with Express.js and React that fetches and serves M3U playlists from the IPTV-org public source. The server provides a clean, user-friendly interface for accessing free IPTV channels from around the world.

## Features
- Express.js backend serving M3U playlist endpoint
- Real-time server status monitoring
- Beautiful, responsive UI with dark mode
- Copy-to-clipboard functionality for easy playlist URL sharing
- Server uptime tracking
- Quick start guide for users
- Compatible with VLC, Kodi, and other IPTV players

## Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with node-fetch for playlist retrieval
- **Data Source**: IPTV-org public M3U playlist

## API Endpoints
- `GET /api/status` - Server status and information
- `GET /playlist.m3u` - M3U playlist endpoint (cached for 1 hour)

## Tech Stack
- React + TypeScript
- Express.js
- Tailwind CSS
- shadcn/ui components
- TanStack Query for data fetching
- Wouter for routing

## Recent Changes
- ✅ Initial implementation of IPTV streaming server (October 16, 2025)
- ✅ Created responsive UI with server status page in dark mode
- ✅ Implemented playlist fetching and serving functionality
- ✅ Added caching for improved performance (1-hour cache)
- ✅ Added comprehensive loading and error states
- ✅ Implemented auto-refresh for server status (every 5 seconds)
- ✅ Added robust error handling for upstream failures
- ✅ All end-to-end tests passing
