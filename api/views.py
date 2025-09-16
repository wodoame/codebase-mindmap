from rest_framework import viewsets
from core.models import MindMap
from .serializers import MindMapSerializer
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from urllib.parse import urlparse, urljoin
from urllib.request import Request as UrlRequest, urlopen
import urllib.error
import re
import html

# MindMap API CRUD endpoints
class MindMapViewSet(viewsets.ModelViewSet):
	queryset = MindMap.objects.all()
	serializer_class = MindMapSerializer

class Test(APIView):
    def post(self, request: Request):
        print(request.data)
        return Response({'message': 'successful'})


class LinkPreview(APIView):
    def get(self, request: Request):
        url = request.query_params.get('url', '').strip()
        if not url:
            return Response({"error": "Missing url"}, status=400)

        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return Response({"error": "Invalid scheme"}, status=400)

        # Quick image-by-extension shortcut
        if re.search(r"\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$", parsed.path, re.I):
            return Response({
                'type': 'image',
                'url': url,
                'image': url
            })

        # Try a HEAD-like lightweight GET and parse limited bytes
        try:
            req = UrlRequest(url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; MindmapBot/1.0)'
            })
            with urlopen(req, timeout=6) as resp:
                content_type = resp.headers.get('Content-Type', '')
                if 'image' in content_type:
                    return Response({'type': 'image', 'url': url, 'image': url})

                # Read up to 256KB
                raw = resp.read(262144)
                text = raw.decode('utf-8', errors='ignore')
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
            # Fallback minimal response
            return Response({'type': 'link', 'url': url})

        # Extract meta tags via regex (simple but effective for OG/Twitter)
        def meta(prop):
            m = re.search(r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]*content=["\']([^"\']+)["\']' % re.escape(prop), text, re.I)
            return html.unescape(m.group(1)) if m else None

        def meta_any(props):
            for p in props:
                v = meta(p)
                if v:
                    return v
            return None

        title = meta_any(['og:title', 'twitter:title'])
        if not title:
            m = re.search(r'<title[^>]*>(.*?)</title>', text, re.I | re.S)
            if m:
                title = html.unescape(m.group(1).strip())

        description = meta_any(['og:description', 'twitter:description', 'description'])
        image = meta_any(['og:image', 'twitter:image'])
        site_name = meta_any(['og:site_name'])

        if image:
            image = urljoin(url, image)

        return Response({
            'type': 'link',
            'url': url,
            'title': title,
            'description': description,
            'image': image,
            'siteName': site_name
        })