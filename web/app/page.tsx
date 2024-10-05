// page.tsx

import React from 'react';
import PurchaseCarbonCredits from '@/components/solana/PurchaseCarbonCredits'; // Adjust the path if necessary

export default function Home() {
    return (
        <div>
            <h1>Welcome to the Carbon Credits Marketplace</h1>
            <PurchaseCarbonCredits />
        </div>
    );
}
