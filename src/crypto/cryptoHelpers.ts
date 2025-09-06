import { publicClient } from "@/app/milady/CryptoProvider";

const getMetadataURIForNFTCollection = async (collectionAddress: `0x${string}`): Promise<string | null> => {
    // Try to read the collection base URI from multiple possible contract sources:
    
    // 1) config() -> returns a tuple whose first element is baseUri
    // 2) baseUri() -> string
    // 3) baseURI() -> string
    let metadataUri = '';
    
    // Full Config ABI (we only need the baseUri which is the first returned value)
    const configAbi = [
        {
            "inputs": [],
            "name": "config",
            "outputs": [
                { "internalType": "string", "name": "baseUri", "type": "string" },
                { "internalType": "address", "name": "affiliateSigner", "type": "address" },
                { "internalType": "address", "name": "ownerAltPayout", "type": "address" },
                { "internalType": "address", "name": "superAffiliatePayout", "type": "address" },
                { "internalType": "uint32", "name": "maxSupply", "type": "uint32" },
                { "internalType": "uint32", "name": "maxBatchSize", "type": "uint32" },
                { "internalType": "uint16", "name": "affiliateFee", "type": "uint16" },
                { "internalType": "uint16", "name": "platformFee", "type": "uint16" },
                { "internalType": "uint16", "name": "defaultRoyalty", "type": "uint16" },
                {
                    "components": [
                        { "internalType": "uint16", "name": "affiliateDiscount", "type": "uint16" },
                        {
                            "components": [
                                { "internalType": "uint16", "name": "numMints", "type": "uint16" },
                                { "internalType": "uint16", "name": "mintDiscount", "type": "uint16" }
                            ], "internalType": "struct MintTier[]", "name": "mintTiers", "type": "tuple[]"
                        }
                    ], "internalType": "struct Discount", "name": "discounts", "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    try {
        const cfg = await publicClient.readContract({
            address: collectionAddress,
            abi: configAbi,
            functionName: 'config',
            args: [],
        });
        
        // cfg can be an object with named props, an array-like tuple, or a single string depending on ABI parsing.
        if (cfg) {
            if (typeof cfg === 'string') metadataUri = cfg;
            else if (Array.isArray(cfg) && typeof cfg[0] === 'string') metadataUri = cfg[0];
            else if ((cfg as any).baseUri && typeof (cfg as any).baseUri === 'string') metadataUri = (cfg as any).baseUri;
        }
    } catch (err) {
        // config() not available or failed, we'll try other common names below.
    }
    
    if (!metadataUri) {
        const baseUriAbi = [{ "inputs": [], "name": "baseUri", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }];
        try {
            const base = await publicClient.readContract({
                address: collectionAddress,
                abi: baseUriAbi,
                functionName: 'baseUri',
                args: [],
            }) as string;
            if (base) metadataUri = base;
        } catch (err) {
            // ignore
        }
    }
    
    if (!metadataUri) {
        const baseURIAbi = [{ "inputs": [], "name": "baseURI", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }];
        try {
            const base = await publicClient.readContract({
                address: collectionAddress,
                abi: baseURIAbi,
                functionName: 'baseURI',
                args: [],
            }) as string;
            if (base) metadataUri = base;
        } catch (err) {
            // ignore
        }
    }
    
    return metadataUri;
}

const getWalletNFTsByCollection = async (wallet: `0x${string}`, collectionAddress: `0x${string}`) => {
    const erc721Abi = [
        {
            "constant": true,
            "inputs": [{ "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "owner", "type": "address" }
            ],
            "name": "tokensOfOwner",
            "outputs": [
                { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "owner", "type": "address" },
                { "internalType": "uint256", "name": "start", "type": "uint256" },
                { "internalType": "uint256", "name": "stop", "type": "uint256" }
            ],
            "name": "tokensOfOwnerIn",
            "outputs": [
                { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    let allTokens: bigint[] = [];
    
    // First try tokensOfOwner() (some contracts expose this convenience method).
    let usedTokensOfOwner = false;
    try {
        const tokensDirect = await publicClient.readContract({
            address: collectionAddress,
            abi: erc721Abi,
            functionName: 'tokensOfOwner',
            args: [wallet],
        }) as bigint[];
        
        if (tokensDirect && tokensDirect.length) {
            allTokens = tokensDirect;
            usedTokensOfOwner = true;
        }
    } catch (err) {
        // tokensOfOwner not available on this contract; we'll fall back to tokensOfOwnerIn.
        // No-op.
    }
    
    if (!usedTokensOfOwner) {
        const balanceBigInt = await publicClient.readContract({
            address: collectionAddress,
            abi: erc721Abi,
            functionName: 'balanceOf',
            args: [wallet],
        });
        
        const tokenBalance = Number(balanceBigInt);
        
        // Discover collection size via totalSupply() when available, otherwise fall back to 1111.
        let collectionSize = 1111;
        try {
            const totalSupplyAbi = [
                {
                    "inputs": [],
                    "name": "totalSupply",
                    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                    "stateMutability": "view",
                    "type": "function"
                }
            ];
            
            const totalSupplyBigInt = await publicClient.readContract({
                address: collectionAddress,
                abi: totalSupplyAbi,
                functionName: 'totalSupply',
                args: [],
            }) as bigint;
            
            if (totalSupplyBigInt !== undefined && totalSupplyBigInt !== null) {
                const maybeNumber = Number(totalSupplyBigInt);
                if (Number.isFinite(maybeNumber) && maybeNumber > 0) collectionSize = maybeNumber;
            }
        } catch (err) {
            console.warn('totalSupply() not available for', collectionAddress, '- falling back to', collectionSize, err);
        }
        const pageSize = collectionSize > 100 ? 100 : collectionSize;
        
        // Iterate over collection pages, but stop early once we've collected tokenBalance tokens.
        for (let start = 0; start < collectionSize && allTokens.length < tokenBalance; start += pageSize) {
            const stop = Math.min(start + pageSize, collectionSize);
            const tokensPage = await publicClient.readContract({
                address: collectionAddress,
                abi: erc721Abi,
                functionName: 'tokensOfOwnerIn',
                args: [wallet, BigInt(start), BigInt(stop)],
            }) as bigint[];
            if (tokensPage && tokensPage.length) {
                allTokens = allTokens.concat(tokensPage);
            }
            
        }
    }
    
    const tokens = allTokens.map(id => id.toString());
    
    return tokens;
};

export { getMetadataURIForNFTCollection, getWalletNFTsByCollection };
