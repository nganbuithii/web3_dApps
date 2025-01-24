import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { notification } from 'antd';
import BNBTransferForm from './components/BNBTransferForm';
import TokenTransferForm from './components/TokenTransferForm';

const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const TOKEN_ADDRESS = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee";

interface WalletState {
  address: string;
  bnbBalance: string;
  tokenBalance: string;
  connected: boolean;
  tokenSymbol: string;
}

interface TransferFormData {
  to: string;
  amount: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const App = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: '',
    bnbBalance: '0',
    tokenBalance: '0',
    connected: false,
    tokenSymbol: 'TOKEN'
  });
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'bnb' | 'token'>('bnb');

  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      setWallet(JSON.parse(savedWallet));
    }
  }, []);

  const saveWalletState = (walletState: WalletState) => {
    localStorage.setItem('wallet', JSON.stringify(walletState));
  };

  const clearWalletState = () => {
    localStorage.removeItem('wallet');
  };
  const getTokenBalance = async (address: string, provider: ethers.Provider) => {
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
      // const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);

      const [balance, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals().catch(() => 18),
        tokenContract.symbol().catch(() => 'TOKEN')
      ]);

      return {
        balance: ethers.formatUnits(balance, decimals),
        symbol
      };
    } catch (error) {
      console.error('Error getting token balance:', error);
      return {
        balance: '0',
        symbol: 'TOKEN'
      };
    }
  };



  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        notification.error({
          message: "No Binance Smart Chain wallet detected",
          description: "Please install MetaMask or another compatible wallet.",
        });
        return;
      }

      const BSC_TESTNET_PARAMS = {
        chainId: "0x61",
        chainName: "BNB Chain Testnet",
        nativeCurrency: {
          name: "Testnet Binance Coin",
          symbol: "BNB",
          decimals: 18,
        },
        rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
        blockExplorerUrls: ["https://testnet.bscscan.com"],
      };

      let provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== BigInt(BSC_TESTNET_PARAMS.chainId)) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BSC_TESTNET_PARAMS],
          });

          provider = new ethers.BrowserProvider(window.ethereum);
        } catch (error) {
          notification.error({
            message: "Failed to switch to BNB Chain Testnet",
            description: "Please check your wallet settings and try again.",
          });
          return;
        }
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      const { balance: tokenBalance, symbol: tokenSymbol } = await getTokenBalance(address, provider);

      const newWalletState: WalletState = {
        address,
        bnbBalance: ethers.formatEther(balance),
        tokenBalance,
        connected: true,
        tokenSymbol,
      };

      setWallet(newWalletState);
      saveWalletState(newWalletState);

      notification.success({
        message: "Wallet connected successfully on BNB Chain Testnet",
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      notification.error({
        message: "Failed to connect wallet",
      });
    }
  };
  const handleDisconnect = () => {
    setWallet({
      address: '',
      bnbBalance: '0',
      tokenBalance: '0',
      connected: false,
      tokenSymbol: 'TOKEN',
    });
    clearWalletState();
  };

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData({
  //     ...formData,
  //     [e.target.name]: e.target.value
  //   });
  // };

  // const handleErc20TransferInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setErc20TransferData({
  //     ...erc20TransferData,
  //     [e.target.name]: e.target.value
  //   });
  // };

  const handleSubmitBNB = async (data: any) => {
    // e.preventDefault();
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const amount = ethers.parseEther(data.amount);

      const tx = await signer.sendTransaction({
        to: data.to,
        value: amount
      });

      await tx.wait();
      const newBalance = await provider.getBalance(wallet.address);
      const { balance: tokenBalance } = await getTokenBalance(wallet.address, provider);

      setWallet(prev => ({
        ...prev,
        bnbBalance: ethers.formatEther(newBalance),
        tokenBalance
      }));
      notification.success({
        message: 'Transfer BNB Success',
      });
      // reset();
    } catch (error) {
      notification.error({
        message: 'Transfer BNB Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleErc20TransferSubmit = async (data: TransferFormData) => {
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);

      const amount = ethers.parseUnits(data.amount, 18);

      const tx = await tokenContract.transfer(data.to, amount);
      await tx.wait();

      // Cập nhật lại số dư token sau khi chuyển
      const { balance: tokenBalance } = await getTokenBalance(wallet.address, provider);
      setWallet(prev => ({
        ...prev,
        tokenBalance
      }));

      notification.success({
        message: 'Transfer Token Success',
      });

      // reset();
    } catch (error) {
      notification.error({
        message: 'Transfer Token Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 p-8">
      <nav className="flex items-center justify-between mb-16 w-full">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">web3</h1>
        </div>
        {wallet.connected && (
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('bnb')}
              className="text-gray-300 hover:text-white"
            >
              Transfer BNB
            </button>
            <button
              onClick={() => setActiveTab('token')}
              className="text-gray-300 hover:text-white"
            >
              Transfer Token
            </button>
            <button onClick={handleDisconnect} className="bg-red-600 text-white py-2 px-4 rounded-lg">
              Disconnect
            </button>
          </div>)}
      </nav>

      <div className="w-full mx-auto">
        <div className=" justify-between items-center mb-16 w-full">
          <div >
            {!wallet.connected && (
              <button
                onClick={connectWallet}
                className="text-center mx-auto flex bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold w-32"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {wallet.connected && (
            <div className="w-full gap-12 grid grid-cols-2">
              <div className="bg-gradient-to-br from-pink-400 via-purple-400 to-green-300 p-6 rounded-2xl mb-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-600">⟠</span>
                    </div>
                    <span className="ml-2 text-white opacity-80">Address:</span>
                  </div>
                  <p className="text-white truncate">{wallet.address}</p>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-600">💰</span>
                    </div>
                    <span className="ml-2 text-white opacity-80">BNB Balance:</span>
                  </div>
                  <p className="text-white">{wallet.bnbBalance} BNB</p>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-600">🪙</span>
                    </div>
                    <span className="ml-2 text-white opacity-80">{wallet.tokenSymbol} Balance:</span>
                  </div>
                  <p className="text-white">{wallet.tokenBalance} {wallet.tokenSymbol}</p>
                </div>
              </div>

              {activeTab === 'bnb' && (
                <BNBTransferForm
                  walletBalance={wallet?.bnbBalance || '0'}
                  onSubmit={handleSubmitBNB}
                  loading={loading}
                />
              )}
              {activeTab === 'token' && (
                <TokenTransferForm
                walletBalance={wallet.tokenBalance}
                onSubmit={handleErc20TransferSubmit}
                loading={loading}
              />
              )}

            </div>

          )}
        </div>
      </div>
    </div>
  );
};

export default App;