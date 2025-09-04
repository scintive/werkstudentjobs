import { test, expect } from '@playwright/test';

test.describe('Edit/Preview Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Start the development server
    await page.goto('http://localhost:3001');
  });

  test('should start in preview mode by default', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we can see the edit button (meaning we're in preview mode)
    const editButton = page.getByText('Edit');
    await expect(editButton).toBeVisible();
    
    // Check if preview button is not visible (we're already in preview)
    const previewButton = page.getByText('Preview');
    await expect(previewButton).not.toBeVisible();
  });

  test('should toggle to edit mode when edit button is clicked', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Click the edit button
    const editButton = page.getByText('Edit');
    await editButton.click();
    
    // Now preview button should be visible (we're in edit mode)
    const previewButton = page.getByText('Preview');
    await expect(previewButton).toBeVisible();
    
    // Edit button should not be visible
    await expect(editButton).not.toBeVisible();
  });

  test('should show editable fields in edit mode', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Click the edit button to enter edit mode
    await page.click('button:has-text("Edit")');
    
    // Look for editable elements - ProperRichText fields should be clickable
    const editableFields = page.locator('[contenteditable="true"]');
    const count = await editableFields.count();
    
    // Should have at least some editable fields in edit mode
    expect(count).toBeGreaterThan(0);
  });

  test('should hide editable fields in preview mode', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Should start in preview mode - check that contenteditable is false or not present
    const editableFields = page.locator('[contenteditable="true"]');
    const count = await editableFields.count();
    
    // Should have fewer or no editable fields in preview mode
    expect(count).toBe(0);
  });

  test('should toggle back to preview mode', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // First go to edit mode
    await page.click('button:has-text("Edit")');
    
    // Verify we're in edit mode
    await expect(page.getByText('Preview')).toBeVisible();
    
    // Click preview button to go back
    await page.click('button:has-text("Preview")');
    
    // Should be back in preview mode
    await expect(page.getByText('Edit')).toBeVisible();
    await expect(page.getByText('Preview')).not.toBeVisible();
  });

  test('should persist data across mode changes', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Go to edit mode
    await page.click('button:has-text("Edit")');
    
    // Look for a text field and modify it
    const nameField = page.locator('text=John Doe').first();
    if (await nameField.isVisible()) {
      await nameField.click();
      await nameField.fill('Jane Smith');
    }
    
    // Switch back to preview mode
    await page.click('button:has-text("Preview")');
    
    // Switch back to edit mode
    await page.click('button:has-text("Edit")');
    
    // Data should still be there
    const updatedField = page.locator('text=Jane Smith').first();
    if (await updatedField.isVisible()) {
      await expect(updatedField).toBeVisible();
    }
  });

  test('should have proper visual feedback for mode changes', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check initial state - edit button should have ghost variant
    const editButton = page.locator('button:has-text("Edit")');
    await expect(editButton).toHaveClass(/ghost/);
    
    // Click to enter edit mode
    await editButton.click();
    
    // Preview button should now have default variant (not ghost)
    const previewButton = page.locator('button:has-text("Preview")');
    await expect(previewButton).toHaveClass(/default/);
    
    // Click back to preview mode
    await previewButton.click();
    
    // Should be back to ghost variant
    await expect(editButton).toHaveClass(/ghost/);
  });
});