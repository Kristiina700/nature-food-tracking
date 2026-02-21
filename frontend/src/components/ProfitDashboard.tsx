import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { priceApi, stockApi } from '../services/api';
import { User } from '../types';

interface ProfitDashboardProps {
  refreshTrigger: number;
}

interface YearlyData {
  revenue: number;
  cost: number;
  profit: number;
  itemCount: number;
}

interface UserSalesData {
  users: Array<{ user: User; salesByYear: Record<number, YearlyData> }>;
  totalsByYear: Record<number, YearlyData>;
}

export const ProfitDashboard: React.FC<ProfitDashboardProps> = ({ 
  refreshTrigger 
}) => {
  const { t } = useTranslation();
  const [yearlyData, setYearlyData] = useState<Record<number, YearlyData>>({});
  const [userSalesData, setUserSalesData] = useState<UserSalesData>({ users: [], totalsByYear: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfitData();
  }, [refreshTrigger]);

  const loadProfitData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both price-based profit analysis data and user sales data
      const [profitAnalysisData, salesData] = await Promise.all([
        priceApi.getProfitAnalysis(),
        stockApi.getAllUsersSalesByYear()
      ]);
      
      setYearlyData(profitAnalysisData);
      setUserSalesData(salesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profit analysis data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return Object.values(yearlyData).reduce(
      (totals, yearData) => ({
        totalRevenue: totals.totalRevenue + yearData.revenue,
        totalCost: totals.totalCost + yearData.cost,
        totalProfit: totals.totalProfit + yearData.profit,
        totalItems: totals.totalItems + yearData.itemCount,
      }),
      { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalItems: 0 }
    );
  };

  // Remove the user selection requirement

  if (loading) {
    return (
      <div className="card">
        <h2>{t('stock.profitAnalysis')}</h2>
        <div className="empty-state">
          <p>{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>{t('stock.profitAnalysis')}</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  const years = Object.keys(yearlyData).map(Number).sort((a, b) => b - a);
  const totals = calculateTotals();

  if (years.length === 0) {
    return (
      <div className="card">
        <h2>{t('stock.profitAnalysis')}</h2>
        <div className="empty-state">
          <h3>No price data available yet</h3>
          <p>Start adding price data to see market analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{t('stock.profitAnalysis')} - Berry & Mushroom Market Analysis</h2>
      <p style={{ marginBottom: '20px', color: '#718096' }}>
        Market profit analysis based on berry and mushroom price data
      </p>

      {/* Overall Totals */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f7fafc', 
        borderRadius: '8px',
        border: '2px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>Overall Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', textAlign: 'center' }}>
          <div>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '14px', fontWeight: 'bold' }}>Market Entries</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', color: '#2d3748' }}>
              {totals.totalItems}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '14px', fontWeight: 'bold' }}>Avg Sell Price (€/kg)</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', color: '#065f46' }}>
              €{totals.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '14px', fontWeight: 'bold' }}>Avg Buy Price (€/kg)</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', color: '#dc2626' }}>
              €{totals.totalCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '14px', fontWeight: 'bold' }}>Avg Profit (€/kg)</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', color: totals.totalProfit >= 0 ? '#065f46' : '#dc2626' }}>
              €{totals.totalProfit.toFixed(2)}
            </p>
          </div>
          {totals.totalRevenue > 0 && (
            <div>
              <p style={{ margin: 0, color: '#4a5568', fontSize: '14px', fontWeight: 'bold' }}>Market Margin</p>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', color: totals.totalProfit >= 0 ? '#065f46' : '#dc2626' }}>
                {((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Breakdown */}
      <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>Yearly Market Analysis</h3>
      <div style={{ display: 'grid', gap: '15px' }}>
        {years.map(year => {
          const data = yearlyData[year];
          const profitMargin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
          
          return (
            <div 
              key={year}
              style={{ 
                padding: '15px', 
                backgroundColor: '#ffffff', 
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#2d3748', fontSize: '18px' }}>{year}</h4>
                <span style={{ 
                  color: '#718096', 
                  fontSize: '14px',
                  padding: '2px 8px',
                  backgroundColor: '#f7fafc',
                  borderRadius: '4px'
                }}>
                  {data.itemCount} {data.itemCount === 1 ? 'price entry' : 'price entries'}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', textAlign: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#4a5568', fontSize: '12px' }}>Sell Price</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: '#065f46' }}>
                    €{data.revenue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: '#4a5568', fontSize: '12px' }}>Buy Price</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: '#dc2626' }}>
                    €{data.cost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: '#4a5568', fontSize: '12px' }}>Profit</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: data.profit >= 0 ? '#065f46' : '#dc2626' }}>
                    €{data.profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: '#4a5568', fontSize: '12px' }}>Margin</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: data.profit >= 0 ? '#065f46' : '#dc2626' }}>
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Sales Table */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>{t('userSalesTable.title')}</h3>
        {userSalesData.users.length === 0 ? (
          <div className="empty-state">
            <h3>{t('userSalesTable.noSalesData')}</h3>
            <p>{t('userSalesTable.addCollectionsToSee')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f7fafc' }}>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    {t('userSalesTable.userName')}
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    {t('userSalesTable.totalSales')} (€)
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    {t('userSalesTable.totalCost')} (€)
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    {t('userSalesTable.totalProfit')} (€)
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    {t('userSalesTable.profitMargin')}
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    {t('userSalesTable.itemCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {userSalesData.users.map(({ user, salesByYear }) => {
                  const userTotals = Object.values(salesByYear).reduce(
                    (acc, data) => ({
                      revenue: acc.revenue + data.revenue,
                      cost: acc.cost + data.cost,
                      profit: acc.profit + data.profit,
                      itemCount: acc.itemCount + data.itemCount
                    }),
                    { revenue: 0, cost: 0, profit: 0, itemCount: 0 }
                  );
                  
                  const profitMargin = userTotals.revenue > 0 ? (userTotals.profit / userTotals.revenue) * 100 : 0;
                  
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ 
                        padding: '12px', 
                        fontWeight: 'bold',
                        color: '#2d3748'
                      }}>
                        {user.aliasName}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        color: '#065f46',
                        fontWeight: 'bold'
                      }}>
                        €{userTotals.revenue.toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        color: '#dc2626',
                        fontWeight: 'bold'
                      }}>
                        €{userTotals.cost.toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        color: userTotals.profit >= 0 ? '#065f46' : '#dc2626',
                        fontWeight: 'bold'
                      }}>
                        €{userTotals.profit.toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        color: userTotals.profit >= 0 ? '#065f46' : '#dc2626',
                        fontWeight: 'bold'
                      }}>
                        {profitMargin.toFixed(1)}%
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        color: '#4a5568'
                      }}>
                        {userTotals.itemCount}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Summary row */}
                {userSalesData.users.length > 1 && (
                  <tr style={{ 
                    backgroundColor: '#f7fafc', 
                    borderTop: '2px solid #e2e8f0',
                    borderBottom: 'none'
                  }}>
                    <td style={{ 
                      padding: '12px', 
                      fontWeight: 'bold',
                      color: '#2d3748',
                      fontSize: '16px'
                    }}>
                      {t('userSalesTable.summary')}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      color: '#065f46',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      €{Object.values(userSalesData.totalsByYear).reduce((sum, data) => sum + data.revenue, 0).toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      color: '#dc2626',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      €{Object.values(userSalesData.totalsByYear).reduce((sum, data) => sum + data.cost, 0).toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      color: '#065f46',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      €{Object.values(userSalesData.totalsByYear).reduce((sum, data) => sum + data.profit, 0).toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      color: '#065f46',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {(() => {
                        const totalRevenue = Object.values(userSalesData.totalsByYear).reduce((sum, data) => sum + data.revenue, 0);
                        const totalProfit = Object.values(userSalesData.totalsByYear).reduce((sum, data) => sum + data.profit, 0);
                        return totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
                      })()}%
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      color: '#4a5568',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {Object.values(userSalesData.totalsByYear).reduce((sum, data) => sum + data.itemCount, 0)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
