import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const TINY_API_BASE = 'https://api.tiny.com.br/api2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { action, token, formato = 'JSON' } = await req.json()

    if (!token) {
      throw new Error('Token é obrigatório')
    }

    const makeTinyRequest = async (endpoint: string, params: any = {}) => {
      const url = new URL(`${TINY_API_BASE}${endpoint}`)
      url.searchParams.append('token', token)
      url.searchParams.append('formato', formato)
      
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key])
      })

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      return response.json()
    }

    switch (action) {
      case 'test':
        // Teste usando endpoint info.php conforme documentação do Tiny
        const testResult = await makeTinyRequest('/info.php')
        
        if (testResult.retorno?.erro) {
          throw new Error(testResult.retorno.erro)
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: testResult 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'sync':
        // Sincronização conforme API v2 do Tiny
        try {
          const [vendas, compras, produtos, contatos] = await Promise.all([
            makeTinyRequest('/pedidos.pesquisa.php', { dataInicial: '01/01/2024' }),
            makeTinyRequest('/pedidos.compra.pesquisa.php', { dataInicial: '01/01/2024' }),
            makeTinyRequest('/produtos.pesquisa.php'),
            makeTinyRequest('/contatos.pesquisa.php')
          ])

          return new Response(JSON.stringify({
            success: true,
            data: {
              sales: vendas.retorno?.pedidos || [],
              purchases: compras.retorno?.pedidos_compra || [],
              inventory: produtos.retorno?.produtos || [],
              contacts: contatos.retorno?.contatos || [],
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
    console.error('Erro na integração Tiny:', error)
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