
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const BLING_API_V2_BASE = 'https://bling.com.br/Api/v2'
const BLING_API_V3_BASE = 'https://api.bling.com.br/Api/v3'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { action, accessToken, apiKey, version = 'v3' } = await req.json()

    console.log(`Bling Integration - Action: ${action}, Version: ${version}`)

    // Para API v2 usa apikey, para v3 usa accessToken
    if (version === 'v2' && !apiKey) {
      throw new Error('API Key é obrigatório para v2')
    }
    if (version === 'v3' && !accessToken) {
      throw new Error('Access token é obrigatório para v3')
    }

    const apiBase = version === 'v2' ? BLING_API_V2_BASE : BLING_API_V3_BASE
    
    // Headers diferentes para cada versão
    const headers = version === 'v2' 
      ? {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      : {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }

    switch (action) {
      case 'test':
        // Teste de conexão - diferentes endpoints para cada versão
        const testEndpoint = version === 'v2' 
          ? `${apiBase}/contatos/json/?apikey=${apiKey}&estilo=resumido&limite=1`
          : `${apiBase}/me`
          
        console.log(`Testing connection to: ${testEndpoint}`)
        
        const testResponse = await fetch(testEndpoint, { 
          method: 'GET',
          headers 
        })
        
        console.log(`Response status: ${testResponse.status}`)
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text()
          console.error(`Connection failed: ${testResponse.status} - ${errorText}`)
          
          // Tratamento específico para diferentes tipos de erro
          if (testResponse.status === 403) {
            // Parse do erro do Bling para extrair mensagem específica
            try {
              const errorData = JSON.parse(errorText)
              if (errorData.retorno?.erros?.erro?.msg) {
                throw new Error(`Erro Bling: ${errorData.retorno.erros.erro.msg}`)
              }
            } catch (parseError) {
              // Se não conseguir fazer parse, usa mensagem genérica
              throw new Error('Credenciais inválidas ou conta inativa no Bling')
            }
          } else if (testResponse.status === 401) {
            throw new Error('API Key ou Access Token inválido')
          } else if (testResponse.status === 429) {
            throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos')
          }
          
          throw new Error(`Erro de conexão: ${testResponse.status} - ${errorText}`)
        }
        
        const responseData = await testResponse.json()
        console.log('Connection successful:', responseData)
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: responseData,
          version: version 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'sync':
        // Sincronização de dados - diferentes endpoints para cada versão
        try {
          console.log('Starting data synchronization...')
          
          if (version === 'v2') {
            // API v2 usa XML e parâmetros de query diferentes
            const [contatos, produtos, vendas] = await Promise.all([
              fetch(`${apiBase}/contatos/json/?apikey=${apiKey}&limite=100`, { headers }).then(async r => {
                if (!r.ok) {
                  const errorText = await r.text()
                  console.error(`Erro contatos: ${r.status} - ${errorText}`)
                  throw new Error(`Erro ao buscar contatos: ${r.status}`)
                }
                return r.json()
              }),
              fetch(`${apiBase}/produtos/json/?apikey=${apiKey}&limite=100`, { headers }).then(async r => {
                if (!r.ok) {
                  const errorText = await r.text()
                  console.error(`Erro produtos: ${r.status} - ${errorText}`)
                  throw new Error(`Erro ao buscar produtos: ${r.status}`)
                }
                return r.json()
              }),
              fetch(`${apiBase}/pedidos/json/?apikey=${apiKey}&limite=50`, { headers }).then(async r => {
                if (!r.ok) {
                  const errorText = await r.text()
                  console.error(`Erro pedidos: ${r.status} - ${errorText}`)
                  throw new Error(`Erro ao buscar pedidos: ${r.status}`)
                }
                return r.json()
              })
            ])

            console.log('V2 sync completed successfully')

            return new Response(JSON.stringify({
              success: true,
              data: {
                sales: vendas.retorno?.pedidos || [],
                purchases: [],
                inventory: produtos.retorno?.produtos || [],
                contacts: contatos.retorno?.contatos || [],
                financial: [],
                lastSync: new Date().toISOString(),
                version: 'v2'
              }
            }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          } else {
            // API v3 usa OAuth e endpoints diferentes
            const [contatos, produtos, vendas, compras] = await Promise.all([
              fetch(`${apiBase}/contatos?limite=100`, { headers }).then(async r => {
                if (!r.ok) {
                  const errorText = await r.text()
                  console.error(`Erro contatos: ${r.status} - ${errorText}`)
                  throw new Error(`Erro ao buscar contatos: ${r.status}`)
                }
                return r.json()
              }),
              fetch(`${apiBase}/produtos?limite=100`, { headers }).then(async r => {
                if (!r.ok) {
                  const errorText = await r.text()
                  console.error(`Erro produtos: ${r.status} - ${errorText}`)
                  throw new Error(`Erro ao buscar produtos: ${r.status}`)
                }
                return r.json()
              }),
              fetch(`${apiBase}/vendas?limite=50`, { headers }).then(async r => {
                if (!r.ok) {
                  const errorText = await r.text()
                  console.error(`Erro vendas: ${r.status} - ${errorText}`)
                  throw new Error(`Erro ao buscar vendas: ${r.status}`)
                }
                return r.json()
              }),
              fetch(`${apiBase}/compras?limite=50`, { headers }).then(async r => {
                if (!r.ok) {
                  const errorText = await r.text()
                  console.error(`Erro compras: ${r.status} - ${errorText}`)
                  throw new Error(`Erro ao buscar compras: ${r.status}`)
                }
                return r.json()
              })
            ])

            console.log('V3 sync completed successfully')

            return new Response(JSON.stringify({
              success: true,
              data: {
                sales: vendas.data || [],
                purchases: compras.data || [],
                inventory: produtos.data || [],
                contacts: contatos.data || [],
                financial: [],
                lastSync: new Date().toISOString(),
                version: 'v3'
              }
            }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        } catch (syncError) {
          console.error('Sync error:', syncError)
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
