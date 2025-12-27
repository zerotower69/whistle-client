# Network Waterfall Viewer

This document describes the waterfall visualization implementation for the Network page.

## Overview

The Network page now includes a professional Chrome DevTools-style waterfall visualization using the `perf-cascade` library. The implementation provides a complete network monitoring interface with request capture, filtering, and detailed inspection capabilities.

## Architecture

```
Network/
├── components/
│   ├── WaterfallViewer.tsx        # Waterfall visualization using perf-cascade
│   ├── RequestTable.tsx           # Request list table
│   ├── Toolbar.tsx                # Control toolbar with filters
│   └── RequestDetails/
│       └── index.tsx              # 6-tab detail view
├── hooks/
│   ├── useNetworkCapture.ts       # Network capture logic (mock)
│   └── useNetworkFilter.ts        # Filter logic
├── utils/
│   ├── convertToHAR.ts            # HAR format conversion
│   └── exportHAR.ts               # HAR export functionality
├── types.ts                       # TypeScript type definitions
└── index.tsx                      # Main page component
```

## Components

### WaterfallViewer

Renders the waterfall visualization using perf-cascade library.

**Features:**
- Chrome DevTools-style horizontal bars showing request timing
- Color-coded phases (DNS, TCP, SSL, Request, Waiting, Download)
- Time scale and grid lines
- Resource type icons
- Click to select requests

**Props:**
- `harData: Har` - HAR format data
- `height?: number` - Container height (default: 400px)
- `selectedId?: string | null` - Currently selected request ID
- `onRequestSelect?: (requestId: string) => void` - Selection callback

### RequestTable

Table view of all network requests.

**Features:**
- Sortable columns (Name, Status, Method, Type, Size, Time)
- Status color coding (2xx green, 3xx blue, 4xx orange, 5xx red)
- Synchronized selection with waterfall and details
- Responsive scrolling

### Toolbar

Control panel for the Network page.

**Features:**
- Pause/Resume capture
- Clear requests
- Export to HAR file
- Search by URL
- Filter by resource type
- Filter by status code
- Request count display

### RequestDetails

Tabbed detail view for selected request.

**Tabs:**
1. **Overview** - Basic request information
2. **Headers** - Request and response headers
3. **Request** - Request body
4. **Response** - Response body
5. **Timeline** - Detailed timing breakdown
6. **Rules** - Applied Whistle rules (if any)

## Data Flow

```
useNetworkCapture (mock data)
    ↓
NetworkRequest[]
    ↓
useNetworkFilter (filtering)
    ↓
FilteredRequest[]
    ├→ convertToHAR → Har → WaterfallViewer
    ├→ RequestTable
    └→ RequestDetails (via selection)
```

## Integration Points

### Current Implementation (Mock)

The current implementation uses mock data in `useNetworkCapture.ts`. This provides:
- 3 sample requests with realistic timing data
- Different resource types (XHR, CSS, JS)
- Various status codes (200, 304)

### Future Integration (TODO)

To integrate with actual Whistle network capture:

1. Replace `useNetworkCapture` hook implementation
2. Connect to Whistle's network monitoring API
3. Convert Whistle's request format to `NetworkRequest` type
4. Implement real-time updates when `isPaused` is false

Example integration:

```typescript
export const useNetworkCapture = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Connect to Whistle API
    const whistleClient = window.electron.whistle;
    
    const handleRequest = (whistleRequest) => {
      if (!isPaused) {
        const networkRequest = convertWhistleRequest(whistleRequest);
        setRequests(prev => [...prev, networkRequest]);
      }
    };

    whistleClient.on('request', handleRequest);
    return () => whistleClient.off('request', handleRequest);
  }, [isPaused]);

  // ... rest of implementation
};
```

## HAR Format

The implementation uses the standard HAR (HTTP Archive) 1.2 format, which is compatible with:
- Chrome DevTools
- Firefox Developer Tools
- Charles Proxy
- Fiddler
- WebPageTest

### HAR Structure

```json
{
  "log": {
    "version": "1.2",
    "creator": {
      "name": "Whistle Client",
      "version": "1.5.2"
    },
    "entries": [
      {
        "startedDateTime": "2023-12-27T12:00:00.000Z",
        "time": 330,
        "request": { ... },
        "response": { ... },
        "timings": {
          "blocked": 10,
          "dns": 20,
          "connect": 30,
          "send": 5,
          "wait": 200,
          "receive": 50,
          "ssl": 15
        }
      }
    ]
  }
}
```

## Type Definitions

### NetworkRequest

```typescript
interface NetworkRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  statusCode: number;
  statusText: string;
  protocol: string;
  type: ResourceType;
  requestSize: number;
  responseSize: number;
  totalSize: number;
  timing: RequestTiming;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  remoteIP?: string;
  clientIP?: string;
  rules?: string[];
  error?: string;
  startTime: number;
  endTime: number;
}
```

### RequestTiming

```typescript
interface RequestTiming {
  queueing: number;        // Time spent in queue
  dnsLookup: number;       // DNS resolution time
  initialConnection: number; // TCP connection time
  sslHandshake: number;    // SSL/TLS negotiation time
  requestSent: number;     // Time to send request
  waiting: number;         // Time to first byte (TTFB)
  contentDownload: number; // Time to download response
  total: number;           // Total request time
}
```

## Styling

The waterfall viewer uses a dark theme consistent with Chrome DevTools:

- Background: `#2d2d2d`
- Border: `#404040`
- Fixed height: 400px
- Scrollable overflow

## Performance Considerations

- Large request lists (1000+) may impact performance
- Consider implementing virtual scrolling for the table
- Waterfall rendering is optimized by perf-cascade
- Event listeners are properly cleaned up to prevent memory leaks

## Browser Compatibility

- Tested with modern browsers (Chrome, Firefox, Edge)
- Requires SVG support for waterfall rendering
- Uses standard Web APIs (Blob, URL.createObjectURL)

## Future Enhancements

1. **Real-time Updates**: Connect to Whistle's live network monitoring
2. **WebSocket Support**: Add WebSocket frame inspection
3. **Response Preview**: Add image/JSON/HTML preview in Response tab
4. **Advanced Filtering**: Add regex search, multiple filters
5. **HAR Import**: Allow importing HAR files for analysis
6. **Export Options**: Add CSV, JSON export formats
7. **Performance Metrics**: Add page load metrics (DOMContentLoaded, Load)
8. **Network Throttling**: Simulate different network conditions
9. **Request Replay**: Replay captured requests
10. **Diff View**: Compare two requests side-by-side

## Dependencies

- `perf-cascade@^2.11.2` - Waterfall visualization
- `@types/har-format@^1.2.15` - HAR format types
- `antd@^6.0.0` - UI components
- `react@^19.2.3` - React framework

## References

- [perf-cascade GitHub](https://github.com/micmro/PerfCascade)
- [HAR Spec](http://www.softwareishard.com/blog/har-12-spec/)
- [Chrome DevTools Network](https://developer.chrome.com/docs/devtools/network/)
