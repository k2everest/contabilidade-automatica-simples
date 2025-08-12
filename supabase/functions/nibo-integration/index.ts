import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const NIBO_API_BASE = 'https://app.nibo.com.br/api'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, clientId, clientSecret } = await req.json()

    // OAuth token exchange for Nibo
    const getAccessToken = async () => {
      const tokenResponse = await fetch(`${NIBO_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
      })
      const tokenData = await tokenResponse.json()
      return tokenData.access_token
    }

    switch (action) {
      case 'test':
        const accessToken = await getAccessToken()
        if (!accessToken) throw new Error('Falha na autenticação')
        
        const testResponse = await fetch(`${NIBO_API_BASE}/empresas`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (!testResponse.ok) throw new Error('Conexão falhou')
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

      case 'sync':
        const token = await getAccessToken()
        const headers = { 'Authorization': `Bearer ${token}` }
        
        const [vendas, despesas, receitas, clientes] = await Promise.all([
          fetch(`${NIBO_API_BASE}/vendas?limit=50`, { headers }).then(r => r.json()),
          fetch(`${NIBO_API_BASE}/despesas?limit=50`, { headers }).then(r => r.json()),
          fetch(`${NIBO_API_BASE}/receitas?limit=50`, { headers }).then(r => r.json()),
          fetch(`${NIBO_API_BASE}/clientes?limit=100`, { headers }).then(r => r.json())
        ])

        return new Response(JSON.stringify({
          success: true,
          data: {
            sales: vendas.data || [],
            purchases: despesas.data || [],
            inventory: [],
            financial: receitas.data || [],
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