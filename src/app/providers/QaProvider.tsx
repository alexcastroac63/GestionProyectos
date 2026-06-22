import React, { createContext, useContext, useState, useEffect } from 'react';
import { TestSuite, TestCase, TestRun } from '../../types';
import { qaRepository } from '../../features/qa/infrastructure/qaRepository';

export interface QaContextType {
  testSuites: TestSuite[];
  setTestSuites: React.Dispatch<React.SetStateAction<TestSuite[]>>;
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  testRuns: TestRun[];
  setTestRuns: React.Dispatch<React.SetStateAction<TestRun[]>>;
}

export const QaContext = createContext<QaContextType | undefined>(undefined);

export const QaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>(() => qaRepository.loadTestSuites());
  const [testCases, setTestCases] = useState<TestCase[]>(() => qaRepository.loadTestCases());
  const [testRuns, setTestRuns] = useState<TestRun[]>(() => qaRepository.loadTestRuns());

  // Sync state with repository on changes
  useEffect(() => {
    qaRepository.saveTestSuites(testSuites);
  }, [testSuites]);

  useEffect(() => {
    qaRepository.saveTestCases(testCases);
  }, [testCases]);

  useEffect(() => {
    qaRepository.saveTestRuns(testRuns);
  }, [testRuns]);

  return (
    <QaContext.Provider value={{
      testSuites, setTestSuites, testCases, setTestCases, testRuns, setTestRuns
    }}>
      {children}
    </QaContext.Provider>
  );
};

export const useQaStore = () => {
  const context = useContext(QaContext);
  if (!context) throw new Error('useQaStore debe utilizarse dentro de QaProvider o AppProviders');
  return context;
};
