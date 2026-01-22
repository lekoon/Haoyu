/**
 * 交付效率看板页面
 * Delivery Efficiency Dashboard Page
 */

import React from 'react';
import DeliveryEfficiencyDashboard from '../components/resource-viz/DeliveryEfficiencyDashboard';

const DeliveryEfficiency: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500">
            <DeliveryEfficiencyDashboard />
        </div>
    );
};

export default DeliveryEfficiency;
