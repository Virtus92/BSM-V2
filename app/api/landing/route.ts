import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/settings-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview');
    const template = searchParams.get('template');

    let landingSettings;

    if (preview && template) {
      // Preview mode with provided template data
      try {
        landingSettings = JSON.parse(decodeURIComponent(template));
      } catch {
        return NextResponse.json({ error: 'Invalid template data' }, { status: 400 });
      }
    } else {
      // Load from database
      const result = await SettingsService.getPublicSettings();
      if (!result.success) {
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
      }
      landingSettings = result.data?.landing;
    }

    if (!landingSettings) {
      return NextResponse.json({ error: 'No landing page settings found' }, { status: 404 });
    }

    // Generate the landing page HTML based on template type
    let html: string;

    switch (landingSettings.template_type) {
      case 'html':
        html = generateCustomHTML(landingSettings);
        break;
      case 'custom':
        html = generateCustomTemplate(landingSettings);
        break;
      case 'default':
      default:
        html = generateDefaultTemplate(landingSettings);
        break;
    }

    // Set appropriate headers
    const response = new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': preview ? 'no-cache' : 'public, max-age=300',
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating landing page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateCustomHTML(settings: any): string {
  // For pure HTML template, return the custom HTML with injected CSS and JS
  const baseHTML = settings.custom_html || '<!DOCTYPE html><html><head><title>Landing Page</title></head><body><h1>Welcome</h1></body></html>';

  // Inject custom CSS and JS
  let html = baseHTML;

  if (settings.custom_css) {
    const cssTag = `<style>${settings.custom_css}</style>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${cssTag}</head>`);
    } else {
      html = cssTag + html;
    }
  }

  if (settings.custom_js) {
    const jsTag = `<script>${settings.custom_js}</script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${jsTag}</body>`);
    } else {
      html = html + jsTag;
    }
  }

  // Inject head tags
  if (settings.custom_head_tags) {
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${settings.custom_head_tags}</head>`);
    }
  }

  // Inject body tags
  if (settings.custom_body_tags) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${settings.custom_body_tags}</body>`);
    }
  }

  return html;
}

function generateCustomTemplate(settings: any): string {
  // Generate a customizable template with settings
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.meta_title || settings.hero_title || 'Landing Page'}</title>
  <meta name="description" content="${settings.meta_description || settings.hero_subtitle || ''}">
  ${settings.meta_keywords ? `<meta name="keywords" content="${settings.meta_keywords}">` : ''}

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      ${generateBackgroundCSS(settings)}
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 0;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .hero p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.8;
    }

    .cta-button {
      display: inline-block;
      padding: 15px 30px;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.3s;
    }

    .cta-button:hover {
      background: #0056b3;
    }

    .section {
      padding: 80px 0;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
      margin-top: 40px;
    }

    .feature {
      text-align: center;
      padding: 30px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .pricing {
      text-align: center;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin-top: 40px;
    }

    .pricing-card {
      background: white;
      padding: 40px 30px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }

      .hero p {
        font-size: 1rem;
      }
    }

    ${settings.custom_css || ''}
  </style>

  ${settings.custom_head_tags || ''}

  ${settings.enable_analytics && settings.google_analytics_id ? `
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${settings.google_analytics_id}');
  </script>
  ` : ''}
</head>
<body>
  ${settings.show_hero ? generateHeroSection(settings) : ''}

  ${settings.show_features ? generateFeaturesSection(settings) : ''}

  ${settings.show_pricing ? generatePricingSection(settings) : ''}

  ${settings.show_contact ? generateContactSection(settings) : ''}

  ${settings.enable_chat ? generateChatWidget(settings) : ''}

  ${settings.custom_js ? `<script>${settings.custom_js}</script>` : ''}

  ${settings.custom_body_tags || ''}
</body>
</html>`;
}

function generateDefaultTemplate(settings: any): string {
  // Generate the default BSM template with settings
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.meta_title || settings.hero_title || 'Rising BSM V2'}</title>
  <meta name="description" content="${settings.meta_description || settings.hero_subtitle || 'Business Service Management Platform'}">

  <script src="https://cdn.tailwindcss.com"></script>

  ${settings.enable_analytics && settings.google_analytics_id ? `
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${settings.google_analytics_id}');
  </script>
  ` : ''}

  ${settings.custom_head_tags || ''}
</head>
<body class="bg-gray-900 text-white">
  ${settings.show_navigation ? generateNavigation(settings) : ''}

  <!-- Hero Section -->
  <section class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-4xl mx-auto">
      <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        ${settings.hero_title || 'Rising BSM V2'}
      </h1>
      <p class="text-xl md:text-2xl text-gray-300 mb-8">
        ${settings.hero_subtitle || 'Die Zukunft des Business Managements'}
      </p>
      ${settings.cta_button_text ? `
      <a href="${settings.cta_button_url || '#'}" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors">
        ${settings.cta_button_text}
      </a>
      ` : ''}
    </div>
  </section>

  ${settings.show_features ? `
  <!-- Features Section -->
  <section class="py-20 px-4 bg-gray-800">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">Features</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center p-6 bg-gray-700 rounded-lg">
          <h3 class="text-xl font-semibold mb-4">CRM System</h3>
          <p class="text-gray-300">Komplettes Kundenmanagement mit intelligenten Workflows</p>
        </div>
        <div class="text-center p-6 bg-gray-700 rounded-lg">
          <h3 class="text-xl font-semibold mb-4">Dokumenten-Hub</h3>
          <p class="text-gray-300">Zentrale Verwaltung aller Geschäftsdokumente</p>
        </div>
        <div class="text-center p-6 bg-gray-700 rounded-lg">
          <h3 class="text-xl font-semibold mb-4">Projekt-Tracking</h3>
          <p class="text-gray-300">Echzeit-Übersicht über alle laufenden Projekte</p>
        </div>
      </div>
    </div>
  </section>
  ` : ''}

  ${settings.show_pricing ? generatePricingSection(settings) : ''}

  ${settings.show_footer ? generateFooter(settings) : ''}

  ${settings.enable_chat ? generateChatWidget(settings) : ''}

  ${settings.custom_js ? `<script>${settings.custom_js}</script>` : ''}

  ${settings.custom_body_tags || ''}
</body>
</html>`;
}

function generateBackgroundCSS(settings: any): string {
  switch (settings.background_type) {
    case 'color':
      return `background: ${settings.background_value || '#000'};`;
    case 'gradient':
      return `background: ${settings.background_value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};`;
    case 'image':
      return `background: url('${settings.background_value}') center/cover no-repeat;`;
    default:
      return 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
  }
}

function generateHeroSection(settings: any): string {
  return `
  <section class="hero">
    <div class="container">
      <h1>${settings.hero_title || 'Welcome'}</h1>
      <p>${settings.hero_subtitle || 'Your business solution'}</p>
      ${settings.cta_button_text ? `
      <a href="${settings.cta_button_url || '#'}" class="cta-button">
        ${settings.cta_button_text}
      </a>
      ` : ''}
    </div>
  </section>
  `;
}

function generateFeaturesSection(settings: any): string {
  return `
  <section class="section">
    <div class="container">
      <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 2rem;">Features</h2>
      <div class="features">
        <div class="feature">
          <h3>CRM System</h3>
          <p>Komplettes Kundenmanagement</p>
        </div>
        <div class="feature">
          <h3>Dokumenten-Hub</h3>
          <p>Zentrale Dokumentenverwaltung</p>
        </div>
        <div class="feature">
          <h3>Projekt-Tracking</h3>
          <p>Echzeit-Projektübersicht</p>
        </div>
      </div>
    </div>
  </section>
  `;
}

function generatePricingSection(settings: any): string {
  return `
  <section class="section pricing">
    <div class="container">
      <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">Preise</h2>
      <div class="pricing-grid">
        <div class="pricing-card">
          <h3>Starter</h3>
          <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">€29/Monat</div>
          <p>Für kleine Teams</p>
        </div>
        <div class="pricing-card">
          <h3>Professional</h3>
          <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">€99/Monat</div>
          <p>Für wachsende Unternehmen</p>
        </div>
        <div class="pricing-card">
          <h3>Enterprise</h3>
          <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">Individuell</div>
          <p>Für große Organisationen</p>
        </div>
      </div>
    </div>
  </section>
  `;
}

function generateContactSection(settings: any): string {
  return `
  <section class="section" style="text-align: center;">
    <div class="container">
      <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">Kontakt</h2>
      <p style="font-size: 1.25rem; margin-bottom: 2rem;">Bereit loszulegen? Kontaktieren Sie uns!</p>
      <a href="mailto:info@example.com" class="cta-button">Kontakt aufnehmen</a>
    </div>
  </section>
  `;
}

function generateNavigation(settings: any): string {
  return `
  <nav class="fixed top-0 w-full bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <span class="text-xl font-bold">BSM</span>
        </div>
        <div class="hidden md:flex space-x-8">
          <a href="#" class="text-gray-300 hover:text-white">Home</a>
          <a href="#" class="text-gray-300 hover:text-white">Features</a>
          <a href="#" class="text-gray-300 hover:text-white">Preise</a>
          <a href="#" class="text-gray-300 hover:text-white">Kontakt</a>
        </div>
      </div>
    </div>
  </nav>
  `;
}

function generateFooter(settings: any): string {
  return `
  <footer class="bg-gray-800 py-12 px-4">
    <div class="max-w-7xl mx-auto text-center">
      <div class="flex justify-center items-center mb-4">
        <span class="text-lg font-semibold">Rising BSM V2</span>
      </div>
      <div class="text-sm text-gray-400">
        © 2024 Rising BSM V2. Alle Rechte vorbehalten.
      </div>
    </div>
  </footer>
  `;
}

function generateChatWidget(settings: any): string {
  return `
  <div id="chat-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
    <button style="background: #007bff; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 24px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      💬
    </button>
  </div>
  `;
}