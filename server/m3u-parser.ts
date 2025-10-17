// M3U playlist parser
export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  country?: string;
  language?: string;
  category?: string;
}

export function parseM3U(content: string): Channel[] {
  const lines = content.split('\n').filter(line => line.trim());
  const channels: Channel[] = [];
  
  let currentChannel: Partial<Channel> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip the header
    if (line === '#EXTM3U') continue;
    
    // Parse channel info line
    if (line.startsWith('#EXTINF:')) {
      // Extract attributes from the line
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const countryMatch = line.match(/tvg-country="([^"]+)"/);
      const languageMatch = line.match(/tvg-language="([^"]+)"/);
      
      // Extract channel name (after the last comma)
      const nameMatch = line.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
      
      currentChannel = {
        name,
        logo: logoMatch ? logoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : undefined,
        country: countryMatch ? countryMatch[1] : undefined,
        language: languageMatch ? languageMatch[1] : undefined,
        category: groupMatch ? groupMatch[1] : undefined,
      };
    } 
    // Parse URL line
    else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentChannel.name) {
        // Generate ID from name and URL
        const id = Buffer.from(`${currentChannel.name}-${line}`).toString('base64').substring(0, 16);
        
        channels.push({
          id,
          name: currentChannel.name,
          url: line,
          logo: currentChannel.logo,
          group: currentChannel.group,
          country: currentChannel.country,
          language: currentChannel.language,
          category: currentChannel.category,
        });
        
        currentChannel = {};
      }
    }
  }
  
  return channels;
}

export function filterChannels(
  channels: Channel[],
  filters: {
    country?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): { channels: Channel[]; total: number } {
  let filtered = channels;
  
  // Apply country filter
  if (filters.country) {
    filtered = filtered.filter(ch => 
      ch.country?.toLowerCase().includes(filters.country!.toLowerCase())
    );
  }
  
  // Apply category filter
  if (filters.category) {
    filtered = filtered.filter(ch => 
      ch.category?.toLowerCase().includes(filters.category!.toLowerCase())
    );
  }
  
  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(ch => 
      ch.name.toLowerCase().includes(searchLower) ||
      ch.country?.toLowerCase().includes(searchLower) ||
      ch.category?.toLowerCase().includes(searchLower)
    );
  }
  
  const total = filtered.length;
  
  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  filtered = filtered.slice(offset, offset + limit);
  
  return { channels: filtered, total };
}

export function getUniqueValues(channels: Channel[], field: keyof Channel): string[] {
  const values = new Set<string>();
  channels.forEach(ch => {
    const value = ch[field];
    if (value && typeof value === 'string') {
      values.add(value);
    }
  });
  return Array.from(values).sort();
}
