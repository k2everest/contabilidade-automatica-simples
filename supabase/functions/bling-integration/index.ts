import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const BLING_API_BASE = 'https://api.bling.com.br/Api/v3'

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
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    switch (action) {
      case 'test':
        // Teste de conexão usando endpoint /me conforme documentação
        const testResponse = await fetch(`${BLING_API_BASE}/me`, { 
          method: 'GET',
          headers 
        })
        
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
        // Sincronização de dados conforme API v3 do Bling
        try {
          const [contatos, produtos, vendas, compras] = await Promise.all([
            fetch(`${BLING_API_BASE}/contatos?limite=100`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro contatos: ${r.status}`)
              return r.json()
            }),
            fetch(`${BLING_API_BASE}/produtos?limite=100`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro produtos: ${r.status}`)
              return r.json()
            }),
            fetch(`${BLING_API_BASE}/vendas?limite=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro vendas: ${r.status}`)
              return r.json()
            }),
            fetch(`${BLING_API_BASE}/compras?limite=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro compras: ${r.status}`)
              return r.json()
            })
          ])

          return new Response(JSON.stringify({
            success: true,
            data: {
              sales: vendas.data || [],
              purchases: compras.data || [],
              inventory: produtos.data || [],
              contacts: contatos.data || [],
              financial: [],
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
    console.error('Erro na integração Bling:', error)
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