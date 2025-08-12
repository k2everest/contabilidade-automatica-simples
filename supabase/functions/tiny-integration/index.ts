import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const TINY_API_BASE = 'https://api.tiny.com.br/api2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, token, formato = 'JSON' } = await req.json()

    const makeTinyRequest = async (endpoint: string, params: any = {}) => {
      const url = new URL(`${TINY_API_BASE}${endpoint}`)
      url.searchParams.append('token', token)
      url.searchParams.append('formato', formato)
      
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key])
      })

      const response = await fetch(url.toString())
      return response.json()
    }

    switch (action) {
      case 'test':
        const testResult = await makeTinyRequest('/info.php')
        if (testResult.retorno?.erro) throw new Error(testResult.retorno.erro)
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

      case 'sync':
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