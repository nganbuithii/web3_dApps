// BNBTransferForm.tsx
import { Spin } from 'antd';
import React from 'react';
import { useForm } from 'react-hook-form';

interface BNBTransferFormProps {
    walletBalance: string;
    onSubmit: (data: any) => void;
    loading: boolean;
}

const BNBTransferForm: React.FC<BNBTransferFormProps> = ({ walletBalance, onSubmit, loading }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-[rgba(255,255,255,0.1)] p-6 rounded-xl mb-4">
            <div className="mb-4">
                <label htmlFor="to" className="text-white">Recipient Address:</label>
                <input
                    type="text"
                    id="to"
                    {...register("to", {
                        required: "Recipient address is required",
                        validate: (value) => /^0x[a-fA-F0-9]{40}$/.test(value) || "Invalid Ethereum address",
                    })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300"
                />
                {errors.to && <p className="text-red-500">{(errors.to as any).message}</p>}
            </div>

            <div className="mb-4">
                <label htmlFor="amount" className="text-white">Amount:</label>
                <input
                    type="text"
                    id="amount"
                    {...register('amount', {
                        required: 'Amount is required',
                        validate: (value) => {
                            const total = parseFloat(value) + 0.0001; 
                            if (isNaN(total)) {
                                return 'Amount must be a number';
                            }
                            if (total > parseFloat(walletBalance)) {
                                return `Total amount exceeds your balance`;
                            }
                            return true;
                        },
                    })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300"
                />
                {errors.amount && <p className="text-red-500">{(errors.amount as any).message}</p>}
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                disabled={loading}
            >
                {loading ? <Spin /> : 'Send BNB'}
            </button>
        </form>
    );
};

export default BNBTransferForm;
