import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const BLING_API_BASE = 'https://www.bling.com.br/Api/v3'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { action, apiKey, accessToken } = await req.json()

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...corsHeaders
    }

    switch (action) {
      case 'test':
        const testResponse = await fetch(`${BLING_API_BASE}/me`, { headers })
        if (!testResponse.ok) throw new Error('Conexão falhou')
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

      case 'sync':
        const [vendas, compras, produtos, contatos] = await Promise.all([
          fetch(`${BLING_API_BASE}/vendas?limite=50`, { headers }).then(r => r.json()),
          fetch(`${BLING_API_BASE}/compras?limite=50`, { headers }).then(r => r.json()),
          fetch(`${BLING_API_BASE}/produtos?limite=100`, { headers }).then(r => r.json()),
          fetch(`${BLING_API_BASE}/contatos?limite=100`, { headers }).then(r => r.json())
        ])

        return new Response(JSON.stringify({
          success: true,
          data: {
            sales: vendas.data || [],
            purchases: compras.data || [],
            inventory: produtos.data || [],
            financial: [],
            lastSync: new Date().toISOString()
          }
        }), { headers: corsHeaders })

      default:
        throw new Error('Ação não suportada')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: corsHeaders }
    )
  }
})