import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const CONTAAZUL_API_BASE = 'https://api.contaazul.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { action, accessToken } = await req.json()

    if (!accessToken) {
      throw new Error('Access token é obrigatório')
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    switch (action) {
      case 'test':
        // Teste de conexão conforme documentação da ContaAzul
        const testResponse = await fetch(`${CONTAAZUL_API_BASE}/v1/me`, { headers })
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text()
          throw new Error(`Conexão falhou: ${testResponse.status} - ${errorText}`)
        }
        
        const userData = await testResponse.json()
        
        return new Response(JSON.stringify({ 
          success: true, 
          user: userData 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'sync':
        // Sincronização conforme API da ContaAzul
        try {
          const [vendas, produtos, clientes, contasPagar, contasReceber] = await Promise.all([
            fetch(`${CONTAAZUL_API_BASE}/v1/sales?size=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro vendas: ${r.status}`)
              return r.json()
            }),
            fetch(`${CONTAAZUL_API_BASE}/v1/products?size=100`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro produtos: ${r.status}`)
              return r.json()
            }),
            fetch(`${CONTAAZUL_API_BASE}/v1/customers?size=100`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro clientes: ${r.status}`)
              return r.json()
            }),
            fetch(`${CONTAAZUL_API_BASE}/v1/bills?size=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro contas a pagar: ${r.status}`)
              return r.json()
            }),
            fetch(`${CONTAAZUL_API_BASE}/v1/charge-accounts?size=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro contas a receber: ${r.status}`)
              return r.json()
            })
          ])

          return new Response(JSON.stringify({
            success: true,
            data: {
              sales: vendas || [],
              purchases: contasPagar || [],
              inventory: produtos || [],
              contacts: clientes || [],
              financial: contasReceber || [],
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
    console.error('Erro na integração ContaAzul:', error)
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