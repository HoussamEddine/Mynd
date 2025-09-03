// Simple URL polyfill for React Native
if (!global.URLSearchParams) {
  global.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this.params = {};
      
      if (typeof init === 'string') {
        // Parse query string
        const pairs = init.replace(/^\?/, '').split('&');
        pairs.forEach(pair => {
          if (pair) {
            const [key, value] = pair.split('=');
            if (key) {
              this.params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
          }
        });
      } else if (init && typeof init === 'object') {
        // Handle object initialization
        Object.keys(init).forEach(key => {
          this.params[key] = String(init[key]);
        });
      }
    }
    
    append(name, value) {
      if (this.params[name]) {
        if (Array.isArray(this.params[name])) {
          this.params[name].push(String(value));
        } else {
          this.params[name] = [this.params[name], String(value)];
        }
      } else {
        this.params[name] = String(value);
      }
    }
    
    delete(name) {
      delete this.params[name];
    }
    
    get(name) {
      const value = this.params[name];
      return Array.isArray(value) ? value[0] : value || null;
    }
    
    getAll(name) {
      const value = this.params[name];
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }
    
    has(name) {
      return name in this.params;
    }
    
    set(name, value) {
      this.params[name] = String(value);
    }
    
    toString() {
      const pairs = [];
      Object.keys(this.params).forEach(key => {
        const value = this.params[key];
        if (Array.isArray(value)) {
          value.forEach(v => {
            pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
          });
        } else {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
      });
      return pairs.join('&');
    }
    
    entries() {
      const entries = [];
      Object.keys(this.params).forEach(key => {
        const value = this.params[key];
        if (Array.isArray(value)) {
          value.forEach(v => entries.push([key, v]));
        } else {
          entries.push([key, value]);
        }
      });
      return entries[Symbol.iterator]();
    }
    
    keys() {
      return Object.keys(this.params)[Symbol.iterator]();
    }
    
    values() {
      const values = [];
      Object.keys(this.params).forEach(key => {
        const value = this.params[key];
        if (Array.isArray(value)) {
          values.push(...value);
        } else {
          values.push(value);
        }
      });
      return values[Symbol.iterator]();
    }
  };
}

// Basic URL polyfill if needed
if (!global.URL) {
  global.URL = class URL {
    constructor(url, base) {
      // Very basic URL implementation for our needs
      if (base) {
        url = new URL(base).origin + '/' + url.replace(/^\//, '');
      }
      
      const match = url.match(/^(https?:)\/\/([^\/]+)(\/[^?#]*)(\?[^#]*)?(#.*)?$/);
      if (match) {
        this.protocol = match[1];
        this.host = match[2];
        this.pathname = match[3] || '/';
        this.search = match[4] || '';
        this.hash = match[5] || '';
        this.origin = `${this.protocol}//${this.host}`;
        this.href = url;
      } else {
        throw new Error('Invalid URL');
      }
    }
    
    get searchParams() {
      return new URLSearchParams(this.search);
    }
  };
} 