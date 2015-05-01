import {xdr, Keypair, Hyper, hash, encodeBase58Check} from "stellar-base";

import {Account} from "./account";
import {Currency} from "./currency";

export class Operation {
    /**
    * Returns a the xdr representation of a payment operation.
    * @param {object}   opts
    * @param {Account}  opts.destination    - The destination account for the payment.
    * @param {Currency} opts.currency       - The currency to send
    * @param {string|number} otps.amount    - The amount to send.
    * @param {Account}  [opts.source]       - The source account for the payment. Defaults to the transaction's source account.
    * @param {array}    [opts.path]         - An array of Currency objects to use as the path.
    * @param {string}   [opts.sendMax]      - The max amount of currency to send.
    * @param {string}   [opts.sourceMemo]   - The source memo.
    * @param {string}   [opts.memo]         - The memo.
    */
    static payment(opts) {
        if (!opts.destination) {
            throw new Error("Must provide a destination for a payment operation");
        }
        if (!opts.currency) {
            throw new Error("Must provide a currency for a payment operation");
        }
        if (!opts.amount) {
            throw new Error("Must provide an amount for a payment operation");
        }

        let attributes = {};
        attributes.destination  = Keypair.fromAddress(opts.destination).publicKey();
        attributes.currency     = opts.currency.toXdrObject();
        attributes.amount       = Hyper.fromString(String(opts.amount));
        attributes.sendMax      = opts.sendMax ? Hyper.fromString(String(opts.sendMax)) : attributes.amount;
        attributes.path         = opts.path ? opts.path : [];
        if (opts.sourceMemo) {
            attributes.sourceMemo = opts.sourceMemo;
        } else {
            attributes.sourceMemo = new Buffer(32);
            attributes.sourceMemo.fill(0);
        }
        if (opts.memo) {
            attributes.memo = opts.memo;
        } else {
            attributes.memo = new Buffer(32);
            attributes.memo.fill(0);
        }
        let payment = new xdr.PaymentOp(attributes);

        let opAttributes = {};
        opAttributes.body = xdr.OperationBody.payment(payment);
        if (opts.source) {
            opAttributes.sourceAccount = Keypair.fromAddress(opts.source).publicKey();
        }
        let op = new xdr.Operation(opAttributes);
        return op;
    }

    /**
    * Returns the XDR object for a ChangeTrustOp.
    * @param {object} opts
    * @param {Currency} opts.currency - The currency for the trust line.
    * @param {string} [opts.limit] - The limit for the currency, defaults to max int64.
    *                                If the limit is set to 0 it deletes the trustline.
    * @param {string} [opts.source] - The source account (defaults to transaction source).
    */
    static changeTrust(opts) {
        let attributes      = {};
        attributes.line     = opts.currency.toXdrObject();
        let limit           = opts.limit ? limit : "9223372036854775807";
        attributes.limit    = Hyper.fromString(limit);
        if (opts.source) {
            attributes.source   = opts.source ? opts.source.masterKeypair : null;
        }
        let changeTrustOP = new xdr.ChangeTrustOp(attributes);

        let opAttributes = {};
        opAttributes.body = xdr.OperationBody.changeTrust(changeTrustOP);
        if (opts.source) {
            opAttributes.sourceAccount = Keypair.fromAddress(opts.source).publicKey();
        }
        let op = new xdr.Operation(opAttributes);
        return op;
    }

    /**
    * Converts the xdr wire form of an operation to its "object" form.
    */
    static operationToObject(operation) {
        let obj = {};
        let attrs = operation._value._attributes;
        switch (operation._arm) {
            case "paymentOp":
                obj.type = "paymentOp";
                obj.destination = Account.fromAddress(encodeBase58Check("accountId", attrs.destination));
                obj.currency = Currency.fromOperation(attrs.currency);
                obj.path = attrs.path;
                obj.amount = attrs.amount.toString();
                obj.sendMax = attrs.sendMax.toString();
                obj.sourceMemo = attrs.sourceMemo;
                obj.memo = attrs.memo;
                break;
            case "changeTrustOp":
                obj.type = "changeTrustOp";
                obj.line = Currency.fromOperation(attrs.line);
        }
        return obj;
    }
}