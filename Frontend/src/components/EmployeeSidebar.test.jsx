import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import EmployeeSidebar from './EmployeeSidebar';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPath })
}), { virtual: true });

const mockNavigate = jest.fn();
let mockPath;

const SidebarHarness = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  return (
    <EmployeeSidebar
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
    />
  );
};

const renderSidebar = (designation, path = '/operations-manager/dashboard') => {
  mockPath = path;
  useAuth.mockReturnValue({ user: { designation }, logoutNoCheckout: jest.fn() });
  return render(<SidebarHarness />);
};

beforeEach(() => {
  window.innerWidth = 1280;
  mockNavigate.mockClear();
});

test('operations manager can navigate between their dashboard and My Attendance', () => {
  const { rerender } = renderSidebar(' Operations Manager ');

  const dashboard = screen.getByRole('button', { name: 'My Dashboard' });
  const attendance = screen.getByRole('button', { name: 'My Attendance' });
  expect(dashboard).toHaveAttribute('aria-current', 'page');

  fireEvent.click(attendance);
  expect(mockNavigate).toHaveBeenLastCalledWith('/employee/dashboard');
  mockPath = '/employee/dashboard';
  rerender(<SidebarHarness />);
  expect(attendance).toHaveAttribute('aria-current', 'page');
  expect(dashboard).not.toHaveAttribute('aria-current');

  fireEvent.click(dashboard);
  expect(mockNavigate).toHaveBeenLastCalledWith('/operations-manager/dashboard');
  mockPath = '/operations-manager/dashboard';
  rerender(<SidebarHarness />);
  expect(dashboard).toHaveAttribute('aria-current', 'page');
});

test('other employees do not see the child menu', () => {
  renderSidebar('Developer', '/employee/dashboard');

  expect(screen.queryByRole('button', { name: 'My Attendance' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'My Dashboard' })).toHaveAttribute('aria-current', 'page');
});

test('My Attendance remains accessible when the sidebar is collapsed', () => {
  const { rerender } = renderSidebar('Operations Manager');
  fireEvent.click(screen.getByTitle('Collapse Sidebar'));
  fireEvent.click(screen.getByTitle('My Attendance'));

  expect(mockNavigate).toHaveBeenLastCalledWith('/employee/dashboard');
  mockPath = '/employee/dashboard';
  rerender(<SidebarHarness />);
  expect(screen.getByTitle('My Attendance')).toHaveAttribute('aria-current', 'page');
});

test('mobile navigation closes the sidebar after opening My Attendance', () => {
  window.innerWidth = 500;
  const { container } = renderSidebar('Operations Manager');
  fireEvent.click(container.querySelector('button'));
  fireEvent.click(screen.getByRole('button', { name: 'My Attendance' }));

  expect(mockNavigate).toHaveBeenLastCalledWith('/employee/dashboard');
  expect(container.querySelector('nav').parentElement).toHaveClass('-translate-x-full');
});
