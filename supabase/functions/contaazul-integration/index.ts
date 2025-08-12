import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const CONTAAZUL_API_BASE = 'https://api.contaazul.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, accessToken } = await req.json()

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }

    switch (action) {
      case 'test':
        const testResponse = await fetch(`${CONTAAZUL_API_BASE}/v1/me`, { headers })
        if (!testResponse.ok) throw new Error('Conexão falhou')
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

      case 'sync':
        const [vendas, produtos, clientes, financeiro] = await Promise.all([
          fetch(`${CONTAAZUL_API_BASE}/v1/sales?size=50`, { headers }).then(r => r.json()),
          fetch(`${CONTAAZUL_API_BASE}/v1/products?size=100`, { headers }).then(r => r.json()),
          fetch(`${CONTAAZUL_API_BASE}/v1/customers?size=100`, { headers }).then(r => r.json()),
          fetch(`${CONTAAZUL_API_BASE}/v1/financial-accounts`, { headers }).then(r => r.json())
        ])

        return new Response(JSON.stringify({
          success: true,
          data: {
            sales: vendas || [],
            purchases: [],
            inventory: produtos || [],
            financial: financeiro || [],
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