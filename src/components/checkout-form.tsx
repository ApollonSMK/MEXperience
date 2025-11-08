
'use client'

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useState, type FormEvent } from 'react'
import { Button } from './ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/checkout/return`,
      },
    })

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      toast({
        variant: 'destructive',
        title: 'Erro de Pagamento',
        description: error.message,
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
      })
    }

    setIsLoading(false)
  }

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full mt-6">
        <span id="button-text">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Pagar Agora'}
        </span>
      </Button>
    </form>
  )
}
