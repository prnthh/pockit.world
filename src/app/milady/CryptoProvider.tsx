"use client";

import { getMetadataURIForNFTCollection, getWalletNFTsByCollection } from '@/crypto/cryptoHelpers';
import { Suspense, useContext, useEffect, useRef, useState } from 'react';
import { http, createPublicClient, formatEther } from 'viem'
import { mainnet } from 'viem/chains'
import { ScenePortalContext } from '../ScenePortalProvider';
import { BreakableFrame } from './RoomGame';
import VRMModel from '@/shared/VRMModel';
import { useRouter, useSearchParams } from 'next/navigation';
import PortalDoor from '@/shared/physics/Door';
import HTMLView from '@/shared/shaders/HTMLView';

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

const collectionAddresses: { [key: string]: `0x${string}` } = {
    "pockitmilady": "0x3c9eab7168443e4c962a2bcfa983501b8894547e",
    "kagami": "0x4cc2c3518b1a5b782fa6c5bde80b7388fd8c674f"
};

export const CryptoUser = () => {
    const { scenePortal } = useContext(ScenePortalContext);
    const searchParams = useSearchParams();
    const router = useRouter();

    const wallet = searchParams.get('wallet');
    const [walletAddress, setWalletAddress] = useState(wallet as `0x${string}` | undefined);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setWalletAddress(wallet as `0x${string}` | undefined);
    }, [wallet]);

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
        setLoading(false);
    }

    useEffect(() => {
        const fetchData = async (wallet: `0x${string}`) => {
            await fetchBalanceOfWallet(wallet);

            fetchNFTsOfWallet(wallet, collectionAddresses["pockitmilady"]);
            fetchNFTsOfWallet(wallet, collectionAddresses["kagami"]);
        };
        if (walletAddress) {
            setLoading(true);
            fetchData(walletAddress);
        }
    }, [walletAddress]);

    return <>
        {loading && <div className="text-center text-black absolute top-4 left-4 z-[20]">Loading wallet info...</div>}
        <scenePortal.In>

            {/* <HTMLView /> */}
            {<>
                <PortalDoor
                    label='My Gallery'
                    position={[-1.2, 1.95, -8.6]} rotation={[0, 0, 0]}>
                    Connect your wallet to view your Gallery
                </PortalDoor>
                <PortalDoor position={[1.2, 1.95, -8.6]} rotation={[0, 0, 0]}
                    label='Random Gallery'
                    onConfirm={() => {
                        const params = new URLSearchParams(Array.from(searchParams.entries()));
                        params.set('wallet', "0x6d04a14800b98ed83065cbbd9a55adc1c8f67d38");
                        router.push(`${window.location.pathname}?${params.toString()}`);
                    }}
                >
                    <div className='mt-[200px] text-[72px] text-black'>
                        View a random gallery

                    </div>
                </PortalDoor>
            </>}
            {walletHoldings?.collections?.[collectionAddresses["pockitmilady"]] && (() => {
                const tokens = walletHoldings.collections[collectionAddresses["pockitmilady"]].tokens.slice(0, 5);
                return tokens.map((tokenId, index) => (
                    tokenId &&
                    <group key={tokenId} position={pmPositions[index].pos} rotation={pmPositions[index].rot}>
                        <Suspense>
                            <VRMModel
                                modelUrl={`https://raw.githubusercontent.com/prnthh/Pockit/refs/heads/main/web/${tokenId}.vrm`}
                                scale={[0.5, 0.5, 0.5]}
                                rotation={[0, Math.PI, 0]}
                            />
                            <group rotation={[0, 0, 0]} position={[0, 1, -0.3]}>
                                <BreakableFrame
                                    url={"https://i2.seadn.io/ethereum/0x3c9eab7168443e4c962a2bcfa983501b8894547e/8f9a9905cec209ca302d5741737f32/858f9a9905cec209ca302d5741737f32.gif"}
                                // position={pmPositions[index].pos}
                                />
                            </group>
                        </Suspense>
                        <mesh>
                            <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
                            <meshStandardMaterial color="#5c4a2c" />
                        </mesh>

                    </group>
                ));
            })()}
        </scenePortal.In>
    </>;
}


const pmPositions: { pos: [number, number, number], rot?: [number, number, number] }[] = [
    { pos: [0, 1.95, -8.2], rot: [0, 0, 0] },
    { pos: [-1.8, 0, -1], rot: [0, Math.PI / 2, 0] },
    { pos: [1.8, 0, -1], rot: [0, -Math.PI / 2, 0] },
    { pos: [-1.8, 0, 0.5], rot: [0, Math.PI / 2, 0] },
    { pos: [1.8, 0, 0.5], rot: [0, -Math.PI / 2, 0] },
]