 function getDropdown(id:string){
    return window['FlowbiteInstances']._instances.Dropdown[id];
 }

 interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

function getCsrfToken(): string | null {
  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));
  
  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }
  
  // Fallback: try to get from meta tag
  const csrfMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
  if (csrfMeta) {
    return csrfMeta.content;
  }
  
  // Fallback: try to get from hidden input
  const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]') as HTMLInputElement;
  if (csrfInput) {
    return csrfInput.value;
  }
  
  return null;
}

async function fetchJSONData(url: string, options: FetchOptions = {}){
      try{
      const { method = 'GET', data, headers = {} } = options;
      
      // Set default headers
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      };
      
      // Add CSRF token for non-GET requests (Django requirement)
      if (method !== 'GET') {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          defaultHeaders['X-CSRFToken'] = csrfToken;
        }
      }
      
      // Prepare fetch configuration
      const fetchConfig: RequestInit = {
        method,
        headers: defaultHeaders
      };
      
      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        fetchConfig.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, fetchConfig);
      
      if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json(); 
      return responseData;   
      }
      catch(e){
         console.log('Error fetching data ', e);
         throw e; // Re-throw to allow caller to handle the error
      }
}

export { getDropdown, fetchJSONData };