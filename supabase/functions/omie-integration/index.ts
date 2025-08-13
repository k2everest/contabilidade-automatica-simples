import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const OMIE_API_BASE = 'https://app.omie.com.br/api/v1'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { action, appKey, appSecret } = await req.json()

    if (!appKey || !appSecret) {
      throw new Error('App Key e App Secret são obrigatórios')
    }

    const makeOmieRequest = async (call: string, param: any = {}) => {
      const response = await fetch(`${OMIE_API_BASE}/${call}/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          call,
          app_key: appKey,
          app_secret: appSecret,
          param
        })
      })
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      return response.json()
    }

    switch (action) {
      case 'test':
        // Teste usando endpoint empresas conforme documentação do Omie
        const testResult = await makeOmieRequest('geral/empresas', { 
          pagina: 1, 
          registros_por_pagina: 1 
        })
        
        if (testResult.faultstring) {
          throw new Error(testResult.faultstring)
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: testResult 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'sync':
        // Sincronização conforme API v1 do Omie
        try {
          const [vendas, compras, produtos, clientes] = await Promise.all([
            makeOmieRequest('produtos/pedidovendas', { 
              pagina: 1, 
              registros_por_pagina: 50,
              apenas_importado_api: 'N'
            }),
            makeOmieRequest('produtos/pedidocompras', { 
              pagina: 1, 
              registros_por_pagina: 50 
            }),
            makeOmieRequest('geral/produtos', { 
              pagina: 1, 
              registros_por_pagina: 100 
            }),
            makeOmieRequest('geral/clientes', { 
              pagina: 1, 
              registros_por_pagina: 100 
            })
          ])

          return new Response(JSON.stringify({
            success: true,
            data: {
              sales: vendas.pedido_venda_produto || [],
              purchases: compras.pedido_compra || [],
              inventory: produtos.produto_servico_cadastro || [],
              contacts: clientes.clientes_cadastro || [],
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
    console.error('Erro na integração Omie:', error)
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