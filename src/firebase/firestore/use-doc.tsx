'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  // INITIAL STATE: isLoading is true by default IF a ref is provided.
  const [data, setData] = useState<StateDataType>(undefined as any);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    console.log('[useDoc] useEffect disparado. Ref:', memoizedDocRef?.path);

    if (!memoizedDocRef) {
      console.log('[useDoc] Ref nula, resetando estado.');
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('[useDoc] Ref existe. Configurando isLoading para true e iniciando o listener.');
    setIsLoading(true);
    setError(null);
    setData(undefined as any); // Limpa dados antigos

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        console.log(`[useDoc] Snapshot recebido para '${memoizedDocRef.path}'. Existe: ${snapshot.exists()}`);
        if (snapshot.exists()) {
          const docData = { ...(snapshot.data() as T), id: snapshot.id };
          console.log('[useDoc] Documento existe. Dados:', docData);
          setData(docData);
        } else {
          console.log('[useDoc] Documento não existe.');
          setData(null);
        }
        setError(null);
        setIsLoading(false);
        console.log('[useDoc] Estado atualizado. isLoading: false.');
      },
      (error: FirestoreError) => {
        console.error(`[useDoc] Erro no listener para '${memoizedDocRef.path}':`, error);
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)
        console.log('[useDoc] Erro de permissão. Estado atualizado. isLoading: false.');

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => {
      console.log(`[useDoc] Limpando listener para '${memoizedDocRef?.path}'.`);
      unsubscribe();
    }
  }, [memoizedDocRef]); // Re-run if the memoizedDocRef changes.

  console.log(`[useDoc] Retornando para '${memoizedDocRef?.path}':`, { data, isLoading, error });
  return { data, isLoading, error };
}
