import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const ALTERDATA_API_BASE = 'https://api.alterdata.com.br'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { action, apiKey, companyId } = await req.json()

    if (!apiKey || !companyId) {
      throw new Error('API Key e Company ID são obrigatórios')
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Company-ID': companyId
    }

    switch (action) {
      case 'test':
        // Teste de conexão conforme padrão AlterData
        const testResponse = await fetch(`${ALTERDATA_API_BASE}/v1/companies/${companyId}`, { headers })
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text()
          throw new Error(`Conexão falhou: ${testResponse.status} - ${errorText}`)
        }
        
        const companyData = await testResponse.json()
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: companyData 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'sync':
        // Sincronização conforme API da AlterData
        try {
          const [vendas, compras, produtos, financeiro, clientes] = await Promise.all([
            fetch(`${ALTERDATA_API_BASE}/v1/sales?limit=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro vendas: ${r.status}`)
              return r.json()
            }),
            fetch(`${ALTERDATA_API_BASE}/v1/purchases?limit=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro compras: ${r.status}`)
              return r.json()
            }),
            fetch(`${ALTERDATA_API_BASE}/v1/products?limit=100`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro produtos: ${r.status}`)
              return r.json()
            }),
            fetch(`${ALTERDATA_API_BASE}/v1/financial-entries?limit=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro financeiro: ${r.status}`)
              return r.json()
            }),
            fetch(`${ALTERDATA_API_BASE}/v1/customers?limit=100`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro clientes: ${r.status}`)
              return r.json()
            })
          ])

          return new Response(JSON.stringify({
            success: true,
            data: {
              sales: vendas.items || [],
              purchases: compras.items || [],
              inventory: produtos.items || [],
              contacts: clientes.items || [],
              financial: financeiro.items || [],
              lastSync: new Date().toISOString()
            }
          }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } catch (syncError) {
          throw new Error(`Erro na sincronização: ${syncError.message}`)
        }

      default:
        throw new Error('Ação não suportada')
    }
  } catch (error) {
    console.error('Erro na integração AlterData:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})