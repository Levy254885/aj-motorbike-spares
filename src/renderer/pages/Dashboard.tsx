import React, { useEffect, useState } from 'react';
import type { Settings } from '../../shared/types';
import { money } from '../helpers';
import { Stat, Table } from '../components/ui';

export function Dashboard() {
  const [data, setData] = useState<any>();
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    void Promise.all([window.aj.dashboard(), window.aj.getSettings()]).then(([dashboardData, appSettings]) => {
      setData(dashboardData);
      setSettings(appSettings);
    });
  }, []);
  return (
    <section>
      <div className="stats">
        <Stat label="Today's sales" value={money(data?.todaySales || 0, settings?.currency)} />
        <Stat label="Transactions" value={data?.totalOrders || 0} />
        <Stat label="Low stock" value={data?.lowStockItems || 0} />
        <Stat label="Products in stock" value={data?.productsInStock || 0} />
      </div>
      <div className="stats">
        <Stat label="Cash in drawer" value={money(data?.cashInDrawer || 0, settings?.currency)} />
        <Stat label="Inventory value" value={money(data?.inventoryValue || 0, settings?.currency)} />
      </div>
      <div className="panel">
        <h2>Recent transactions</h2>
        <Table rows={data?.quick || []} currency={settings?.currency} />
      </div>
      <div className="panel">
        <h2>Top selling today</h2>
        <Table rows={data?.topProducts || []} currency={settings?.currency} />
      </div>
    </section>
  );
}
