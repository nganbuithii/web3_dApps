
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import {  Spin } from 'antd';

interface TransferFormData {
    to: string;
    amount: string;
}

interface TokenTransferFormProps {
    walletBalance: string;
    onSubmit: (data: TransferFormData) => void;
    loading: boolean;
}

const TokenTransferForm = ({ walletBalance, onSubmit, loading }: TokenTransferFormProps) => {
    const { register, handleSubmit, formState: { errors },  } = useForm<TransferFormData>();

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-[rgba(255,255,255,0.1)] p-6 rounded-xl mb-4">
            <div className="mb-4">
                <label htmlFor="to" className="text-white">Recipient Address:</label>
                <input
                    type="text"
                    id="to"
                    {...register('to', {
                        required: 'Recipient address is required',
                        validate: value => ethers.isAddress(value) || 'Invalid address format'
                    })}
                    className="w-full mt-2 p-4 bg-gray-700 rounded-md text-white"
                />
                {errors.to && <span className="text-red-500">{errors.to.message}</span>}
            </div>
            <div className="mb-4">
                <label htmlFor="amount" className="text-white">Amount:</label>
                <input
                    type="number"
                    id="amount"
                    {...register('amount', {
                        required: 'Amount is required',
                        validate: value => {
                            return Number(value) > 0 && Number(value) <= parseFloat(walletBalance) || 'Amount must be greater than zero and less than or equal to your token balance';
                        }
                    })}
                    className="w-full mt-2 p-4 bg-gray-700 rounded-md text-white"
                />
                {errors.amount && <span className="text-red-500">{errors.amount.message}</span>}
            </div>
            <button type="submit" className="w-full bg-blue-600 p-4 rounded-md text-white" disabled={loading}>
                {loading ? <Spin /> : 'Transfer Tokens'}
            </button>
        </form>
    );
};

export default TokenTransferForm;
