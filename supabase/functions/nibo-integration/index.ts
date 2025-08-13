import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const NIBO_API_BASE = 'https://api.nibo.com.br'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { action, clientId, clientSecret } = await req.json()

    if (!clientId || !clientSecret) {
      throw new Error('Client ID e Client Secret são obrigatórios')
    }

    // OAuth token exchange conforme documentação do Nibo
    const getAccessToken = async () => {
      const tokenResponse = await fetch(`${NIBO_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'read write'
        })
      })
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Falha na autenticação: ${tokenResponse.status} - ${errorText}`)
      }
      
      const tokenData = await tokenResponse.json()
      return tokenData.access_token
    }

    switch (action) {
      case 'test':
        // Teste de autenticação e conexão
        const accessToken = await getAccessToken()
        
        if (!accessToken) {
          throw new Error('Falha na autenticação - token não recebido')
        }
        
        const testResponse = await fetch(`${NIBO_API_BASE}/v1/empresas`, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        })
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text()
          throw new Error(`Falha no teste: ${testResponse.status} - ${errorText}`)
        }
        
        const userData = await testResponse.json()
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: userData 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'sync':
        // Sincronização conforme API do Nibo
        const token = await getAccessToken()
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
        
        try {
          const [vendas, despesas, receitas, empresas] = await Promise.all([
            fetch(`${NIBO_API_BASE}/v1/vendas?limit=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro vendas: ${r.status}`)
              return r.json()
            }),
            fetch(`${NIBO_API_BASE}/v1/despesas?limit=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro despesas: ${r.status}`)
              return r.json()
            }),
            fetch(`${NIBO_API_BASE}/v1/receitas?limit=50`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro receitas: ${r.status}`)
              return r.json()
            }),
            fetch(`${NIBO_API_BASE}/v1/empresas`, { headers }).then(async r => {
              if (!r.ok) throw new Error(`Erro empresas: ${r.status}`)
              return r.json()
            })
          ])

          return new Response(JSON.stringify({
            success: true,
            data: {
              sales: vendas.data || [],
              purchases: despesas.data || [],
              inventory: [],
              contacts: empresas.data || [],
              financial: receitas.data || [],
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
    console.error('Erro na integração Nibo:', error)
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