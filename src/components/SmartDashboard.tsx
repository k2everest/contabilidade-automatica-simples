
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface SmartDashboardProps {
  integrationData: any;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ integrationData }) => {
  // Calcular métricas inteligentes dos dados integrados
  const calculateMetrics = () => {
    let totalSales = 0;
    let totalPurchases = 0;
    let totalProducts = 0;
    let totalCustomers = 0;
    let salesTrend = 0;

    Object.values(integrationData).forEach((data: any) => {
      if (data.sales) {
        totalSales += data.sales.reduce((sum: number, sale: any) => sum + sale.value, 0);
        totalCustomers += new Set(data.sales.map((sale: any) => sale.customer)).size;
        
        // Calcular tendência de vendas (últimos 7 dias vs anteriores)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recent = data.sales.filter((sale: any) => new Date(sale.date) > sevenDaysAgo);
        const older = data.sales.filter((sale: any) => new Date(sale.date) <= sevenDaysAgo);
        
        const recentTotal = recent.reduce((sum: number, sale: any) => sum + sale.value, 0);
        const olderTotal = older.reduce((sum: number, sale: any) => sum + sale.value, 0);
        
        if (olderTotal > 0) {
          salesTrend = ((recentTotal - olderTotal) / olderTotal) * 100;
        }
      }
      
      if (data.purchases) {
        totalPurchases += data.purchases.reduce((sum: number, purchase: any) => sum + purchase.value, 0);
      }
      
      if (data.inventory) {
        totalProducts += data.inventory.length;
      }
    });

    return {
      totalSales,
      totalPurchases,
      totalProducts,
      totalCustomers,
      salesTrend,
      profit: totalSales - totalPurchases,
      profitMargin: totalSales > 0 ? ((totalSales - totalPurchases) / totalSales) * 100 : 0
    };
  };

  const metrics = calculateMetrics();
  const hasData = Object.keys(integrationData).length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum dado disponível
          </h3>
          <p className="text-gray-500">
            Conecte e sincronize seus ERPs para ver as análises inteligentes aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Vendas Totais</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(metrics.totalSales)}
                </p>
                <div className="flex items-center mt-2">
                  {metrics.salesTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    metrics.salesTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(metrics.salesTrend).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs semana anterior</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Lucro Líquido</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(metrics.profit)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    Margem: {metrics.profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</p>
                <p className="text-sm text-gray-500 mt-2">Em estoque</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
                <p className="text-sm text-gray-500 mt-2">Únicos</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso de Conformidade Fiscal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span>Conformidade Fiscal - Simples Nacional</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dados Sincronizados</span>
              <span className="text-sm text-gray-500">100%</span>
            </div>
            <Progress value={100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Livros Obrigatórios</span>
              <span className="text-sm text-gray-500">75%</span>
            </div>
            <Progress value={75} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Relatórios Mensais</span>
              <span className="text-sm text-gray-500">60%</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartDashboard;
