import mongoose from "mongoose";

// Define the Follow schema
const EtherWalletSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  privateKey: { type: String, required: true },
  isMain: { type: Boolean, default: true },
  createdBy: { type: String, requried: true},
  createdAt: { type: Date, default: Date.now }
});

const EtherWallet = mongoose.model('ether_wallet', EtherWalletSchema);

export default EtherWallet;