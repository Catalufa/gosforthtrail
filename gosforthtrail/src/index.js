import mainTemplate from './templates/main.html';
import adminTemplate from './templates/admin.html';
import claimTemplate from './templates/claim.html';

// Admin key - 10 digits
const ADMIN_KEY = '7428951360';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle API endpoints
    if (path === '/api/locations' && request.method === 'GET') {
      return await getLocations(env);
    }

    if (path === '/api/locations' && request.method === 'POST') {
      return await addLocation(request, env);
    }

    if (path === '/api/progress' && request.method === 'POST') {
      return await updateProgress(request, env);
    }

    if (path === '/api/claim-reward' && request.method === 'POST') {
      return await generateClaimCode(request, env);
    }

    if (path === '/api/verify-claim' && request.method === 'GET') {
      return await verifyClaimCode(url, env);
    }

    // Serve HTML pages
    if (path === '/') {
      return new Response(mainTemplate, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (path === '/admin') {
      return new Response(adminTemplate, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (path === '/claim') {
      return new Response(claimTemplate, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function getLocations(env) {
  try {
    const locations = await env.HUNT_DATA.get('locations', 'json');
    return new Response(JSON.stringify(locations || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function addLocation(request, env) {
  try {
    const { key, location } = await request.json();

    if (key !== ADMIN_KEY) {
      return new Response(JSON.stringify({ error: 'Invalid admin key' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let locations = await env.HUNT_DATA.get('locations', 'json');
    if (!locations) locations = [];

    const newLocation = {
      id: locations.length + 1,
      lat: location.lat,
      lng: location.lng,
      title: location.title,
      description: location.description,
      trivia: location.trivia,
      createdAt: new Date().toISOString()
    };

    locations.push(newLocation);
    await env.HUNT_DATA.put('locations', JSON.stringify(locations));

    return new Response(JSON.stringify({ success: true, location: newLocation }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add location' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateProgress(request, env) {
  try {
    const { currentLocation } = await request.json();
    // Progress is stored client-side, but we could store session data here if needed
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update progress' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function generateClaimCode(request, env) {
  try {
    const claimCode = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    await env.HUNT_DATA.put(`claim:${claimCode}`, JSON.stringify({
      code: claimCode,
      claimedAt: new Date().toISOString(),
      used: false
    }));

    return new Response(JSON.stringify({ claimCode }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate claim code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function verifyClaimCode(url, env) {
  const claimKey = url.searchParams.get('key');
  if (!claimKey) {
    return new Response(JSON.stringify({ valid: false }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const claimData = await env.HUNT_DATA.get(`claim:${claimKey}`, 'json');
  if (claimData && !claimData.used) {
    claimData.used = true;
    await env.HUNT_DATA.put(`claim:${claimKey}`, JSON.stringify(claimData));
    return new Response(JSON.stringify({ valid: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ valid: false }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
