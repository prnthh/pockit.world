"use client";

import { getMetadataURIForNFTCollection, getWalletNFTsByCollection } from '@/crypto/cryptoHelpers';
import { useContext, useEffect, useState } from 'react';
import { http, createPublicClient, formatEther } from 'viem'
import { mainnet } from 'viem/chains'
import { ScenePortalContext } from '../ScenePortalProvider';
import { ImageRow } from '../milady/RoomGame';
import SimpleModel from '@/shared/SimpleModel';
import VRMModel from '@/shared/VRMModel';

export const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
})

export type NFTCollection = {
    address: `0x${string}`,
    chain: string,
    balance: number,
    tokens: string[],
    metadataUri: string
}

export const CryptoUser = ({ walletAddress }: { walletAddress: `0x${string}` }) => {
    const { scenePortal } = useContext(ScenePortalContext);

    const [walletHoldings, setWalletHoldings] = useState<{
        balance?: number,
        collections?: {
            [address: string]: NFTCollection
        }
    }>({});

    const fetchBalanceOfWallet = async (wallet: `0x${string}`) => {
        const balance = await publicClient.getBalance({
            address: wallet,
        });

        setWalletHoldings(prev => ({
            ...prev,
            balance: Number(formatEther(balance))
        }));
    };

    const fetchNFTsOfWallet = async (wallet: `0x${string}`, collectionAddress: `0x${string}`) => {
        // ERC-721 ABI fragment for balanceOf, tokenOfOwnerByIndex, and tokensOfOwner
        const tokens = await getWalletNFTsByCollection(wallet, collectionAddress);
        const metadataUri = await getMetadataURIForNFTCollection(collectionAddress);

        const collectionData = {
            address: collectionAddress,
            chain: 'mainnet',
            balance: tokens.length,
            tokens: tokens,
            metadataUri: metadataUri || ''
        };

        console.log(collectionData);

        setWalletHoldings(prev => ({
            ...prev,
            collections: {
                ...prev.collections,
                [collectionAddress]: collectionData
            }
        }));
    }

    useEffect(() => {
        const fetchData = async () => {
            await fetchBalanceOfWallet(walletAddress);
            fetchNFTsOfWallet(walletAddress, `0x3c9eab7168443e4c962a2bcfa983501b8894547e`);
            fetchNFTsOfWallet(walletAddress, `0x4cc2c3518b1a5b782fa6c5bde80b7388fd8c674f`);
        };
        fetchData();
    }, []);

    return <scenePortal.In>
        <ImageRow position={[0, 1, -3]} />
        <ImageRow position={[0, 1, -3]} />
        <VRMModel position={[0, 1, -3]} scale={[0.5, 0.5, 0.5]} />
    </scenePortal.In>;
}

