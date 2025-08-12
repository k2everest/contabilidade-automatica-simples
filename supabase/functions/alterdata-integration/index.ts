import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const ALTERDATA_API_BASE = 'https://api.alterdata.com.br'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, apiKey, companyId } = await req.json()

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Company-ID': companyId
    }

    switch (action) {
      case 'test':
        const testResponse = await fetch(`${ALTERDATA_API_BASE}/v1/companies/${companyId}`, { headers })
        if (!testResponse.ok) throw new Error('Conexão falhou')
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

      case 'sync':
        const [vendas, compras, produtos, financeiro] = await Promise.all([
          fetch(`${ALTERDATA_API_BASE}/v1/sales?limit=50`, { headers }).then(r => r.json()),
          fetch(`${ALTERDATA_API_BASE}/v1/purchases?limit=50`, { headers }).then(r => r.json()),
          fetch(`${ALTERDATA_API_BASE}/v1/products?limit=100`, { headers }).then(r => r.json()),
          fetch(`${ALTERDATA_API_BASE}/v1/financial-entries?limit=50`, { headers }).then(r => r.json())
        ])

        return new Response(JSON.stringify({
          success: true,
          data: {
            sales: vendas.items || [],
            purchases: compras.items || [],
            inventory: produtos.items || [],
            financial: financeiro.items || [],
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