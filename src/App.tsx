import React, { useState } from 'react';
import { ethers } from 'ethers';
import { notification } from 'antd';

const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },  
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
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
    "outputs": [{"name": "", "type": "bool"}],
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
  const [formData, setFormData] = useState<TransferFormData>({
    to: '',
    amount: ''
  });
  const [erc20TransferData, setErc20TransferData] = useState<TransferFormData>({
    to: '',
    amount: ''
  });
  const [activeTab, setActiveTab] = useState<'bnb' | 'token'>('bnb'); 


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
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const { balance: tokenBalance, symbol: tokenSymbol } = await getTokenBalance(address, provider);
  
        setWallet({
          address,
          bnbBalance: ethers.formatEther(balance),
          tokenBalance,
          connected: true,
          tokenSymbol
        });
  
        notification.success({
          message: 'Connect wallet successfully',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error Fetching Token Balance',
      });
    }
  };
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleErc20TransferInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErc20TransferData({
      ...erc20TransferData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const amount = ethers.parseEther(formData.amount);

      const tx = await signer.sendTransaction({
        to: formData.to,
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
      setFormData({ to: '', amount: '' });
    } catch (error) {
      notification.error({
        message: 'Transfer BNB Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleErc20TransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
  
      const amount = ethers.parseUnits(erc20TransferData.amount, 18); 
  
      const tx = await tokenContract.transfer(erc20TransferData.to, amount);
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
  
      setErc20TransferData({ to: '', amount: '' });
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
          </div>
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
                  <form onSubmit={handleSubmit} className="bg-[rgba(255,255,255,0.1)] p-6 rounded-xl mb-4">
                    <div className="mb-4">
                      <label htmlFor="to" className="text-white">Recipient Address:</label>
                      <input
                        type="text"
                        id="to"
                        name="to"
                        value={formData.to}
                        onChange={handleInputChange}
                        className="w-full mt-2 p-4 bg-gray-700 rounded-md text-white"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="amount" className="text-white">Amount:</label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="w-full mt-2 p-4 bg-gray-700 rounded-md text-white"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Sending BNB...' : 'Send BNB'}
                    </button>
                  </form>
                )}
  
                {activeTab === 'token' && (
                  <form onSubmit={handleErc20TransferSubmit} className="bg-[rgba(255,255,255,0.1)] p-6 rounded-xl mb-4">
                    <div className="mb-4">
                      <label htmlFor="to" className="text-white">Recipient Address:</label>
                      <input
                        type="text"
                        id="to"
                        name="to"
                        value={erc20TransferData.to}
                        onChange={handleErc20TransferInputChange}
                        className="w-full mt-2 p-4 bg-gray-700 rounded-md text-white"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="amount" className="text-white">Amount:</label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={erc20TransferData.amount}
                        onChange={handleErc20TransferInputChange}
                        className="w-full mt-2 p-4 bg-gray-700 rounded-md text-white"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Sending Tokens...' : 'Send Tokens'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  export default App;