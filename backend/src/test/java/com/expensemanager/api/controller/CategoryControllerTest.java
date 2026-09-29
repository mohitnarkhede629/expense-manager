package com.expensemanager.api.controller;

import com.expensemanager.api.model.Category;
import com.expensemanager.api.model.CategoryType;
import com.expensemanager.api.model.User;
import com.expensemanager.api.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryController categoryController;

    private User testUser;
    private Category systemCategory;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        testUser = User.builder()
                .id(7L)
                .email("catuser@example.com")
                .fullName("Cat User")
                .build();

        systemCategory = Category.builder()
                .id(1L)
                .name("Dining Out")
                .categoryType(CategoryType.EXPENSE)
                .icon("Utensils")
                .color("#F59E0B")
                .isSystem(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/categories - returns categories for authenticated user")
    void shouldReturnCategoriesForAuthenticatedUser() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            when(categoryRepository.findByUserIdOrIsSystemTrue(7L)).thenReturn(List.of(systemCategory));

            mockMvc.perform(get("/api/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].name").value("Dining Out"))
                    .andExpect(jsonPath("$[0].categoryType").value("EXPENSE"))
                    .andExpect(jsonPath("$[0].isSystem").value(true));

            verify(categoryRepository).findByUserIdOrIsSystemTrue(7L);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("GET /api/categories - returns 401 Unauthorized when unauthenticated")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("User not authenticated"));
    }
}
