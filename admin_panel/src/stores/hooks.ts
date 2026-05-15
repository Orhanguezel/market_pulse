// src/stores/hooks.ts
'use client';

import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './makeStore';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector);
